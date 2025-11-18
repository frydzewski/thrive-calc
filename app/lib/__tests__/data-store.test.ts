/**
 * Tests for DynamoDB data store operations
 */

import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import {
  saveUserData,
  getUserData,
  listUserData,
  listAllUserData,
  deleteUserData,
  updateUserData,
  queryUserData,
  UserDataRecord,
} from '../data-store';

// Mock uuid to avoid ES module issues
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

// Mock the DynamoDB Document Client
jest.mock('@aws-sdk/lib-dynamodb', () => {
  const mockSend = jest.fn();
  return {
    DynamoDBDocumentClient: {
      from: jest.fn(() => ({
        send: mockSend,
      })),
    },
    PutCommand: jest.fn((params) => params),
    GetCommand: jest.fn((params) => params),
    QueryCommand: jest.fn((params) => params),
    DeleteCommand: jest.fn((params) => params),
    UpdateCommand: jest.fn((params) => params),
  };
});

jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn(() => ({})),
}));

// Get reference to the mocked send function
const getMockSend = () => {
  const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
  const client = DynamoDBDocumentClient.from();
  return client.send as jest.Mock;
};

describe('Data Store Operations', () => {
  let mockSend: jest.Mock;

  beforeEach(() => {
    mockSend = getMockSend();
    mockSend.mockClear();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('saveUserData', () => {
    it('should save data with auto-generated ID', async () => {
      mockSend.mockResolvedValue({});

      const userId = 'user@example.com';
      const dataType = 'scenario';
      const data = { name: 'Test Scenario' };

      const recordId = await saveUserData(userId, dataType, data);

      expect(recordId).toBeDefined();
      expect(typeof recordId).toBe('string');
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should save data with provided ID', async () => {
      mockSend.mockResolvedValue({});

      const userId = 'user@example.com';
      const dataType = 'scenario';
      const data = { name: 'Test Scenario' };
      const providedId = 'custom-id-123';

      const recordId = await saveUserData(userId, dataType, data, providedId);

      expect(recordId).toBe(providedId);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw error on DynamoDB failure', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      await expect(
        saveUserData('user@example.com', 'scenario', { name: 'Test' })
      ).rejects.toThrow('Failed to save user data');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getUserData', () => {
    it('should retrieve existing data', async () => {
      const mockRecord: UserDataRecord = {
        userId: 'user@example.com',
        recordKey: 'scenario#123',
        dataType: 'scenario',
        recordId: '123',
        data: { name: 'Test Scenario' },
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };

      mockSend.mockResolvedValue({ Item: mockRecord });

      const result = await getUserData('user@example.com', 'scenario', '123');

      expect(result).toEqual(mockRecord);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return null for non-existent data', async () => {
      mockSend.mockResolvedValue({});

      const result = await getUserData('user@example.com', 'scenario', 'nonexistent');

      expect(result).toBeNull();
    });

    it('should throw error on DynamoDB failure', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      await expect(
        getUserData('user@example.com', 'scenario', '123')
      ).rejects.toThrow('Failed to get user data');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('listUserData', () => {
    it('should list all records for a data type', async () => {
      const mockRecords: UserDataRecord[] = [
        {
          userId: 'user@example.com',
          recordKey: 'scenario#1',
          dataType: 'scenario',
          recordId: '1',
          data: { name: 'Scenario 1' },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          userId: 'user@example.com',
          recordKey: 'scenario#2',
          dataType: 'scenario',
          recordId: '2',
          data: { name: 'Scenario 2' },
          createdAt: '2024-01-02T00:00:00.000Z',
          updatedAt: '2024-01-02T00:00:00.000Z',
        },
      ];

      mockSend.mockResolvedValue({ Items: mockRecords });

      const result = await listUserData('user@example.com', 'scenario');

      expect(result).toEqual(mockRecords);
      expect(result.length).toBe(2);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no records exist', async () => {
      mockSend.mockResolvedValue({});

      const result = await listUserData('user@example.com', 'scenario');

      expect(result).toEqual([]);
    });

    it('should throw error on DynamoDB failure', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      await expect(
        listUserData('user@example.com', 'scenario')
      ).rejects.toThrow('Failed to list user data');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('listAllUserData', () => {
    it('should list all records for a user across all data types', async () => {
      const mockRecords: UserDataRecord[] = [
        {
          userId: 'user@example.com',
          recordKey: 'scenario#1',
          dataType: 'scenario',
          recordId: '1',
          data: { name: 'Scenario 1' },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        {
          userId: 'user@example.com',
          recordKey: 'account#1',
          dataType: 'account',
          recordId: '1',
          data: { accountName: 'Checking' },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      mockSend.mockResolvedValue({ Items: mockRecords });

      const result = await listAllUserData('user@example.com');

      expect(result).toEqual(mockRecords);
      expect(result.length).toBe(2);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when user has no data', async () => {
      mockSend.mockResolvedValue({});

      const result = await listAllUserData('user@example.com');

      expect(result).toEqual([]);
    });

    it('should throw error on DynamoDB failure', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      await expect(
        listAllUserData('user@example.com')
      ).rejects.toThrow('Failed to list all user data');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('deleteUserData', () => {
    it('should delete a record', async () => {
      mockSend.mockResolvedValue({});

      await deleteUserData('user@example.com', 'scenario', '123');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw error on DynamoDB failure', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      await expect(
        deleteUserData('user@example.com', 'scenario', '123')
      ).rejects.toThrow('Failed to delete user data');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updateUserData', () => {
    it('should update existing record', async () => {
      mockSend.mockResolvedValue({});

      const updatedData = { name: 'Updated Scenario', description: 'New description' };

      await updateUserData('user@example.com', 'scenario', '123', updatedData);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    it('should throw error on DynamoDB failure', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      await expect(
        updateUserData('user@example.com', 'scenario', '123', { name: 'Test' })
      ).rejects.toThrow('Failed to update user data');

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('queryUserData', () => {
    it('should be an alias for listUserData', async () => {
      const mockRecords: UserDataRecord[] = [
        {
          userId: 'user@example.com',
          recordKey: 'scenario#1',
          dataType: 'scenario',
          recordId: '1',
          data: { name: 'Scenario 1' },
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
      ];

      mockSend.mockResolvedValue({ Items: mockRecords });

      const result = await queryUserData('user@example.com', 'scenario');

      expect(result).toEqual(mockRecords);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration scenarios', () => {
    it('should handle save and retrieve flow', async () => {
      const userId = 'user@example.com';
      const dataType = 'scenario';
      const data = { name: 'Integration Test Scenario' };

      // Mock save
      mockSend.mockResolvedValueOnce({});
      const recordId = await saveUserData(userId, dataType, data);

      // Mock retrieve
      const savedRecord: UserDataRecord = {
        userId,
        recordKey: `${dataType}#${recordId}`,
        dataType,
        recordId,
        data,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      mockSend.mockResolvedValueOnce({ Item: savedRecord });

      const retrieved = await getUserData(userId, dataType, recordId);

      expect(retrieved?.data).toEqual(data);
      expect(retrieved?.recordId).toBe(recordId);
    });

    it('should handle update flow', async () => {
      const userId = 'user@example.com';
      const dataType = 'scenario';
      const recordId = '123';
      const originalData = { name: 'Original' };
      const updatedData = { name: 'Updated' };

      // Initial save
      mockSend.mockResolvedValueOnce({});
      await saveUserData(userId, dataType, originalData, recordId);

      // Update
      mockSend.mockResolvedValueOnce({});
      await updateUserData(userId, dataType, recordId, updatedData);

      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('should handle delete flow', async () => {
      const userId = 'user@example.com';
      const dataType = 'scenario';
      const recordId = '123';

      // Mock delete
      mockSend.mockResolvedValue({});
      await deleteUserData(userId, dataType, recordId);

      expect(mockSend).toHaveBeenCalledTimes(1);
    });
  });
});
