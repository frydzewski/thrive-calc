import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
});

const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || process.env.NEXT_PUBLIC_DYNAMODB_TABLE_NAME || 'finplan-user-data';

export interface UserDataRecord {
  userId: string;
  recordKey: string;  // Format: {dataType}#{recordId}
  dataType: string;
  recordId: string;
  data: any;
  createdAt: string;
  updatedAt: string;
}

/**
 * Save user data to DynamoDB
 */
export async function saveUserData(
  userId: string,
  dataType: string,
  data: any,
  recordId?: string
): Promise<string> {
  const id = recordId || uuidv4();
  const now = new Date().toISOString();
  const recordKey = `${dataType}#${id}`;

  const record: UserDataRecord = {
    userId,
    recordKey,
    dataType,
    recordId: id,
    data,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await docClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: record,
      })
    );

    return id;
  } catch (error) {
    console.error('Error saving user data:', error);
    throw new Error('Failed to save user data');
  }
}

/**
 * Get user data from DynamoDB
 */
export async function getUserData(
  userId: string,
  dataType: string,
  recordId: string
): Promise<UserDataRecord | null> {
  const recordKey = `${dataType}#${recordId}`;

  try {
    const response = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          recordKey,
        },
      })
    );

    return response.Item as UserDataRecord || null;
  } catch (error) {
    console.error('Error getting user data:', error);
    throw new Error('Failed to get user data');
  }
}

/**
 * List all records for a user by data type
 */
export async function listUserData(
  userId: string,
  dataType: string
): Promise<UserDataRecord[]> {
  try {
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'DataTypeIndex',
        KeyConditionExpression: 'userId = :userId AND dataType = :dataType',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':dataType': dataType,
        },
      })
    );

    return (response.Items as UserDataRecord[]) || [];
  } catch (error) {
    console.error('Error listing user data:', error);
    throw new Error('Failed to list user data');
  }
}

/**
 * List all records for a user (all data types)
 */
export async function listAllUserData(
  userId: string
): Promise<UserDataRecord[]> {
  try {
    const response = await docClient.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      })
    );

    return (response.Items as UserDataRecord[]) || [];
  } catch (error) {
    console.error('Error listing all user data:', error);
    throw new Error('Failed to list all user data');
  }
}

/**
 * Delete user data
 */
export async function deleteUserData(
  userId: string,
  dataType: string,
  recordId: string
): Promise<void> {
  const recordKey = `${dataType}#${recordId}`;

  try {
    await docClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          recordKey,
        },
      })
    );
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw new Error('Failed to delete user data');
  }
}

/**
 * Update user data
 */
export async function updateUserData(
  userId: string,
  dataType: string,
  recordId: string,
  data: any
): Promise<void> {
  const recordKey = `${dataType}#${recordId}`;
  const now = new Date().toISOString();

  try {
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          userId,
          recordKey,
        },
        UpdateExpression: 'SET #data = :data, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#data': 'data',
        },
        ExpressionAttributeValues: {
          ':data': data,
          ':updatedAt': now,
        },
      })
    );
  } catch (error) {
    console.error('Error updating user data:', error);
    throw new Error('Failed to update user data');
  }
}
