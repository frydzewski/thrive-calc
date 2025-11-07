import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
});

const BUCKET_NAME = process.env.DATA_BUCKET_NAME || process.env.NEXT_PUBLIC_DATA_BUCKET_NAME || '';

export interface UserDataRecord {
  userId: string;
  dataType: string;
  recordId: string;
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Save user data to S3 in Parquet format
 * For now, we'll use JSON format until full Parquet/Iceberg integration is complete
 */
export async function saveUserData(
  userId: string,
  dataType: string,
  data: any,
  recordId?: string
): Promise<string> {
  const id = recordId || uuidv4();
  const now = new Date();

  const record: UserDataRecord = {
    userId,
    dataType,
    recordId: id,
    data,
    createdAt: now,
    updatedAt: now,
  };

  const key = `users/${userId}/${dataType}/${id}.json`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(record),
        ContentType: 'application/json',
        Metadata: {
          userId,
          dataType,
          recordId: id,
        },
      })
    );

    return id;
  } catch (error) {
    console.error('Error saving user data:', error);
    throw new Error('Failed to save user data');
  }
}

/**
 * Get user data from S3
 */
export async function getUserData(
  userId: string,
  dataType: string,
  recordId: string
): Promise<UserDataRecord | null> {
  const key = `users/${userId}/${dataType}/${recordId}.json`;

  try {
    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    );

    if (!response.Body) {
      return null;
    }

    const bodyString = await response.Body.transformToString();
    return JSON.parse(bodyString);
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return null;
    }
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
  const prefix = `users/${userId}/${dataType}/`;

  try {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
      })
    );

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    // Fetch all records
    const records = await Promise.all(
      response.Contents.map(async (object) => {
        if (!object.Key) return null;

        try {
          const data = await s3Client.send(
            new GetObjectCommand({
              Bucket: BUCKET_NAME,
              Key: object.Key,
            })
          );

          if (!data.Body) return null;

          const bodyString = await data.Body.transformToString();
          return JSON.parse(bodyString) as UserDataRecord;
        } catch (error) {
          console.error(`Error fetching ${object.Key}:`, error);
          return null;
        }
      })
    );

    return records.filter((r): r is UserDataRecord => r !== null);
  } catch (error) {
    console.error('Error listing user data:', error);
    throw new Error('Failed to list user data');
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
  const key = `users/${userId}/${dataType}/${recordId}.json`;

  try {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
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
  const existing = await getUserData(userId, dataType, recordId);

  if (!existing) {
    throw new Error('Record not found');
  }

  const updated: UserDataRecord = {
    ...existing,
    data,
    updatedAt: new Date(),
  };

  const key = `users/${userId}/${dataType}/${recordId}.json`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(updated),
      ContentType: 'application/json',
      Metadata: {
        userId,
        dataType,
        recordId,
      },
    })
  );
}
