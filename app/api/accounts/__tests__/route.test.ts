/**
 * Tests for accounts API route
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '../route';
import { queryUserData, saveUserData } from '@/app/lib/data-store';
import { getServerSession } from 'next-auth';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-account-id-123'),
}));

// Mock next-auth
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({ GET: jest.fn(), POST: jest.fn() })),
  getServerSession: jest.fn(),
}));

// Mock data-store
jest.mock('@/app/lib/data-store', () => ({
  queryUserData: jest.fn(),
  saveUserData: jest.fn(),
}));

const mockQueryUserData = queryUserData as jest.MockedFunction<typeof queryUserData>;
const mockSaveUserData = saveUserData as jest.MockedFunction<typeof saveUserData>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Accounts API Route', () => {
  const mockSession = {
    user: {
      email: 'test@example.com',
    },
  };

  const mockAccountRecords = [
    {
      userId: 'test@example.com',
      recordKey: 'account#1',
      dataType: 'account',
      recordId: '1',
      data: {
        accountType: '401k',
        accountName: 'Employer 401k',
        institution: 'Vanguard',
        balance: 100000,
        asOfDate: '2024-01-01',
        status: 'active',
      },
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      userId: 'test@example.com',
      recordKey: 'account#2',
      dataType: 'account',
      recordId: '2',
      data: {
        accountType: 'roth-ira',
        accountName: 'Roth IRA',
        institution: 'Fidelity',
        balance: 50000,
        asOfDate: '2024-01-01',
        status: 'active',
      },
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/accounts', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/accounts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return all accounts for authenticated user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockQueryUserData.mockResolvedValue(mockAccountRecords as any);

      const request = new NextRequest('http://localhost:3000/api/accounts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.accounts).toBeDefined();
      expect(data.accounts.length).toBe(2);
      expect(data.accounts[0].id).toBe('2'); // Sorted newest first
      expect(data.accounts[1].id).toBe('1');
      expect(mockQueryUserData).toHaveBeenCalledWith('test@example.com', 'account');
    });

    it('should return empty array when no accounts exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockQueryUserData.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/accounts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.accounts).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockQueryUserData.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/accounts');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get accounts');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('POST /api/accounts', () => {
    const validAccountData = {
      accountType: '401k',
      accountName: 'My 401k',
      institution: 'Vanguard',
      balance: 50000,
      asOfDate: '2024-01-01',
    };

    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(validAccountData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should create a new account with valid data', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockSaveUserData.mockResolvedValue('test-account-id-123');

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(validAccountData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.account).toBeDefined();
      expect(data.account.id).toBe('test-account-id-123');
      expect(data.account.accountType).toBe('401k');
      expect(data.account.accountName).toBe('My 401k');
      expect(data.account.status).toBe('active');
      expect(mockSaveUserData).toHaveBeenCalledWith(
        'test@example.com',
        'account',
        expect.objectContaining({
          accountType: '401k',
          accountName: 'My 401k',
          balance: 50000,
          status: 'active',
        }),
        'test-account-id-123'
      );
    });

    it('should return 400 if accountType is missing', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const invalidData = { ...validAccountData };
      delete (invalidData as any).accountType;

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('accountType is required');
    });

    it('should return 400 if accountType is invalid', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const invalidData = { ...validAccountData, accountType: 'invalid-type' };

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid accountType');
    });

    it('should return 400 if accountName is missing', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const invalidData = { ...validAccountData };
      delete (invalidData as any).accountName;

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('accountName is required');
    });

    it('should return 400 if accountName is empty', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const invalidData = { ...validAccountData, accountName: '   ' };

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('accountName is required');
    });

    it('should return 400 if balance is missing', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const invalidData = { ...validAccountData };
      delete (invalidData as any).balance;

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('balance is required and must be a number');
    });

    it('should return 400 if balance is not a number', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const invalidData = { ...validAccountData, balance: '50000' };

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('balance is required and must be a number');
    });

    it('should return 400 if balance is negative', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const invalidData = { ...validAccountData, balance: -1000 };

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('balance cannot be negative');
    });

    it('should return 400 if asOfDate is missing', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const invalidData = { ...validAccountData };
      delete (invalidData as any).asOfDate;

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('asOfDate is required');
    });

    it('should accept account without institution', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockSaveUserData.mockResolvedValue('test-account-id-123');

      const dataWithoutInstitution = { ...validAccountData };
      delete (dataWithoutInstitution as any).institution;

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(dataWithoutInstitution),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.account.institution).toBeUndefined();
    });

    it('should accept account with notes', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockSaveUserData.mockResolvedValue('test-account-id-123');

      const dataWithNotes = { ...validAccountData, notes: 'Test notes' };

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(dataWithNotes),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.account.notes).toBe('Test notes');
    });

    it('should handle all valid account types', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockSaveUserData.mockResolvedValue('test-account-id-123');

      const accountTypes = ['401k', 'traditional-ira', 'roth-ira', 'brokerage', 'savings', 'checking'];

      for (const accountType of accountTypes) {
        const data = { ...validAccountData, accountType };
        const request = new NextRequest('http://localhost:3000/api/accounts', {
          method: 'POST',
          body: JSON.stringify(data),
        });

        const response = await POST(request);
        const result = await response.json();

        expect(response.status).toBe(201);
        expect(result.success).toBe(true);
        expect(result.account.accountType).toBe(accountType);
      }
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockSaveUserData.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/accounts', {
        method: 'POST',
        body: JSON.stringify(validAccountData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create account');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
