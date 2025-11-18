/**
 * Migration Script: Email-based userId to Cognito Sub-based userId
 *
 * This script migrates DynamoDB records from using email addresses as
 * the partition key (userId) to using Cognito's immutable sub ID.
 *
 * Usage:
 *   npx ts-node scripts/migrate-user-ids.ts [--dry-run] [--delete-old]
 *
 * Options:
 *   --dry-run: Show what would be migrated without making changes
 *   --delete-old: Delete old email-based records after successful migration
 */

import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
  type UserType
} from '@aws-sdk/client-cognito-identity-provider';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

const AWS_REGION = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || process.env.NEXT_PUBLIC_DYNAMODB_TABLE_NAME || 'finplan-user-data';
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;

if (!USER_POOL_ID) {
  console.error('Error: COGNITO_USER_POOL_ID environment variable is required');
  process.exit(1);
}

const cognitoClient = new CognitoIdentityProviderClient({ region: AWS_REGION });
const dynamoClient = new DynamoDBClient({ region: AWS_REGION });
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

interface EmailToSubMapping {
  email: string;
  sub: string;
}

/**
 * Get all users from Cognito User Pool and create email -> sub mapping
 */
async function getCognitoUserMappings(): Promise<Map<string, string>> {
  const mapping = new Map<string, string>();
  let paginationToken: string | undefined;

  console.log(`Fetching users from Cognito User Pool: ${USER_POOL_ID}`);

  do {
    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      PaginationToken: paginationToken,
    });

    const response = await cognitoClient.send(command);

    if (response.Users) {
      for (const user of response.Users) {
        const email = user.Attributes?.find(attr => attr.Name === 'email')?.Value;
        const sub = user.Attributes?.find(attr => attr.Name === 'sub')?.Value;

        if (email && sub) {
          mapping.set(email.toLowerCase(), sub);
        }
      }
    }

    paginationToken = response.PaginationToken;
  } while (paginationToken);

  console.log(`Found ${mapping.size} users in Cognito`);
  return mapping;
}

/**
 * Scan DynamoDB table for all records
 */
async function scanDynamoDBTable(): Promise<any[]> {
  const items: any[] = [];
  let lastEvaluatedKey: any | undefined;

  console.log(`Scanning DynamoDB table: ${TABLE_NAME}`);

  do {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    const response = await docClient.send(command);

    if (response.Items) {
      items.push(...response.Items);
    }

    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  console.log(`Found ${items.length} records in DynamoDB`);
  return items;
}

/**
 * Check if a string looks like an email address
 */
function isEmail(str: string): boolean {
  return str.includes('@') && str.includes('.');
}

/**
 * Migrate a single record from email-based userId to sub-based userId
 */
async function migrateRecord(
  record: any,
  newUserId: string,
  dryRun: boolean
): Promise<void> {
  const newRecord = {
    ...record,
    userId: newUserId,
  };

  if (dryRun) {
    console.log(`  [DRY-RUN] Would migrate: ${record.userId} -> ${newUserId} (${record.recordKey})`);
  } else {
    try {
      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: newRecord,
        })
      );
      console.log(`  ✓ Migrated: ${record.userId} -> ${newUserId} (${record.recordKey})`);
    } catch (error) {
      console.error(`  ✗ Failed to migrate ${record.recordKey}:`, error);
      throw error;
    }
  }
}

/**
 * Delete old email-based record
 */
async function deleteOldRecord(
  record: any,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`  [DRY-RUN] Would delete old record: ${record.userId} (${record.recordKey})`);
  } else {
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            userId: record.userId,
            recordKey: record.recordKey,
          },
        })
      );
      console.log(`  ✓ Deleted old record: ${record.userId} (${record.recordKey})`);
    } catch (error) {
      console.error(`  ✗ Failed to delete ${record.recordKey}:`, error);
      throw error;
    }
  }
}

/**
 * Main migration function
 */
async function migrate() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const deleteOld = args.includes('--delete-old');

  console.log('\n=== DynamoDB User ID Migration ===');
  console.log(`Region: ${AWS_REGION}`);
  console.log(`Table: ${TABLE_NAME}`);
  console.log(`User Pool: ${USER_POOL_ID}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Delete old records: ${deleteOld ? 'YES' : 'NO'}`);
  console.log('');

  // Step 1: Get Cognito user mappings
  const emailToSubMap = await getCognitoUserMappings();

  if (emailToSubMap.size === 0) {
    console.log('No users found in Cognito User Pool. Nothing to migrate.');
    return;
  }

  // Step 2: Scan DynamoDB table
  const allRecords = await scanDynamoDBTable();

  if (allRecords.length === 0) {
    console.log('No records found in DynamoDB table. Nothing to migrate.');
    return;
  }

  // Step 3: Identify records that need migration
  const recordsToMigrate: Array<{ record: any; newUserId: string }> = [];

  for (const record of allRecords) {
    const currentUserId = record.userId;

    // Check if userId is an email
    if (isEmail(currentUserId)) {
      const emailLower = currentUserId.toLowerCase();
      const sub = emailToSubMap.get(emailLower);

      if (sub) {
        // Check if target record already exists
        const targetExists = allRecords.some(
          r => r.userId === sub && r.recordKey === record.recordKey
        );

        if (targetExists) {
          console.log(`  ⚠ Skipping ${currentUserId} (${record.recordKey}) - target already exists`);
        } else {
          recordsToMigrate.push({ record, newUserId: sub });
        }
      } else {
        console.log(`  ⚠ Warning: No Cognito user found for email: ${currentUserId}`);
      }
    }
  }

  console.log(`\nRecords to migrate: ${recordsToMigrate.length}`);

  if (recordsToMigrate.length === 0) {
    console.log('No records need migration.');
    return;
  }

  // Step 4: Perform migration
  console.log('\nMigrating records...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const { record, newUserId } of recordsToMigrate) {
    try {
      await migrateRecord(record, newUserId, dryRun);
      successCount++;

      // Delete old record if requested
      if (deleteOld && !dryRun) {
        await deleteOldRecord(record, dryRun);
      }
    } catch (error) {
      errorCount++;
    }
  }

  // Summary
  console.log('\n=== Migration Summary ===');
  console.log(`Total records: ${allRecords.length}`);
  console.log(`Records to migrate: ${recordsToMigrate.length}`);
  console.log(`Successful migrations: ${successCount}`);
  console.log(`Failed migrations: ${errorCount}`);

  if (dryRun) {
    console.log('\nℹ️  This was a DRY RUN. No changes were made.');
    console.log('   Run without --dry-run to perform actual migration.');
  } else {
    console.log('\n✅ Migration complete!');
    if (!deleteOld) {
      console.log('   Old email-based records were kept.');
      console.log('   Run with --delete-old to remove them after verifying the migration.');
    }
  }
}

// Run migration
migrate().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
