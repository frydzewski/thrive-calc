# User ID Migration Guide

## Overview

This guide explains how to migrate from email-based user identification to Cognito sub-based identification, improving security and preventing issues if users change their email addresses.

## What Changed

**Before**: API routes used `session.user.email` as the userId (partition key) in DynamoDB.
**After**: API routes use `session.user.id` (Cognito sub) as the userId.

**Why**: Cognito sub IDs are immutable and prevent data access issues if users change their email addresses.

## Migration Steps

### Prerequisites

1. Ensure you have AWS credentials configured with access to:
   - DynamoDB table (read/write permissions)
   - Cognito User Pool (list users permission)

2. Set the following environment variables:
   ```bash
   export AWS_REGION=us-east-1
   export DYNAMODB_TABLE_NAME=finplan-user-data
   export COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   ```

### Step 1: Dry Run

First, run the migration script in dry-run mode to see what changes would be made:

```bash
npx ts-node scripts/migrate-user-ids.ts --dry-run
```

This will:
- List all users from Cognito
- Scan all DynamoDB records
- Show which records would be migrated (without making changes)
- Identify any warnings or issues

### Step 2: Backup (Recommended)

Before running the actual migration, create a backup of your DynamoDB table:

```bash
aws dynamodb create-backup \
  --table-name finplan-user-data \
  --backup-name finplan-user-data-pre-migration-$(date +%Y%m%d)
```

### Step 3: Run Migration

Run the migration script to copy records with new Cognito sub-based userIds:

```bash
npx ts-node scripts/migrate-user-ids.ts
```

This will:
- Create new records with Cognito sub as userId
- Keep old email-based records intact (for rollback safety)
- Report success/failure for each record

### Step 4: Verify Migration

After migration completes:

1. Log in to the application as a test user
2. Verify all data is accessible (accounts, scenarios, profiles)
3. Check CloudWatch logs for any errors
4. Confirm no users are reporting data access issues

### Step 5: Cleanup (Optional)

Once you've verified the migration is successful and users can access their data:

```bash
npx ts-node scripts/migrate-user-ids.ts --delete-old
```

This will remove the old email-based records. **Only do this after thorough verification!**

## Rollback Procedure

If you encounter issues after deployment:

### Option 1: Quick Rollback (if old records still exist)

1. Revert the API route changes:
   ```bash
   git revert <commit-hash>
   ```

2. Deploy the reverted code:
   ```bash
   npm run cdk:deploy
   ```

### Option 2: Restore from Backup

If you've already deleted old records:

1. Restore the DynamoDB table from backup:
   ```bash
   aws dynamodb restore-table-from-backup \
     --target-table-name finplan-user-data \
     --backup-arn <backup-arn>
   ```

2. Revert the code changes and redeploy

## Troubleshooting

### Error: "No Cognito user found for email"

**Cause**: DynamoDB contains records for users that no longer exist in Cognito.

**Solution**: These records will be skipped. You can manually delete them or investigate why the user was deleted from Cognito.

### Error: "Target already exists"

**Cause**: A record with the new Cognito sub-based userId already exists.

**Solution**: The script will skip this record. This is expected if you've run the migration multiple times.

### Users Can't Access Data After Migration

**Possible causes**:
1. Migration script didn't run completely
2. Environment variables weren't set correctly during migration
3. User's Cognito sub doesn't match what was migrated

**Solution**:
1. Check CloudWatch logs for authentication errors
2. Verify the user's Cognito sub matches the userId in DynamoDB:
   ```bash
   aws dynamodb query \
     --table-name finplan-user-data \
     --key-condition-expression "userId = :userId" \
     --expression-attribute-values '{":userId":{"S":"<cognito-sub>"}}'
   ```
3. If records are missing, restore from backup or re-run migration

## Testing

Before deploying to production, test the migration in a staging environment:

1. Copy production Cognito User Pool to staging (or use test users)
2. Copy production DynamoDB table to staging
3. Run migration in staging
4. Test thoroughly with multiple user accounts
5. Verify all features work correctly

## API Routes Changed

The following API routes were updated to use Cognito sub instead of email:

- `/api/profile` (GET, POST, PUT)
- `/api/accounts` (GET, POST)
- `/api/accounts/[id]` (GET, PUT, DELETE)
- `/api/scenarios` (GET, POST)
- `/api/scenarios/[id]` (GET, PUT, DELETE)
- `/api/scenarios/[id]/calculate` (POST)
- `/api/scenarios/[id]/set-default` (POST)
- `/api/projections` (GET)
- `/api/projections/[id]` (GET, DELETE)
- `/api/projections/compare` (GET)

## Security Improvements

This migration provides several security benefits:

1. **Immutable Identity**: Cognito sub IDs never change, preventing data access issues
2. **Email Independence**: Users can change their email without losing access to data
3. **No PII in Keys**: Cognito subs are opaque identifiers, not personally identifiable
4. **Better Security Posture**: Aligns with AWS best practices (Security Grade: A+)

## Support

If you encounter any issues during migration:

1. Check the script output for error messages
2. Review CloudWatch logs for API errors
3. Verify environment variables are set correctly
4. Ensure AWS credentials have necessary permissions

For critical issues, restore from backup and contact your development team.
