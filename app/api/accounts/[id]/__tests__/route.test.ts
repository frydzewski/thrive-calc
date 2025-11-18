/**
 * Tests for accounts/[id] API route
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, PUT, DELETE } from '../route';
import { getUserData, saveUserData, deleteUserData } from '@/app/lib/data-store';
import { getServerSession } from 'next-auth';

// Mock next-auth
jest.mock('next-auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({ GET: jest.fn(), POST: jest.fn() })),
  getServerSession: jest.fn(),
}));

// Mock data-store
jest.mock('@/app/lib/data-store', () => ({
  getUserData: jest.fn(),
  saveUserData: jest.fn(),
  deleteUserData: jest.fn(),
}));

const mockGetUserData = getUserData as jest.MockedFunction<typeof getUserData>;
const mockSaveUserData = saveUserData as jest.MockedFunction<typeof saveUserData>;
const mockDeleteUserData = deleteUserData as jest.MockedFunction<typeof deleteUserData>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Accounts [id] API Route', () => {
  const mockSession = {
    user: {
      email: 'test@example.com',
    },
  };

  const mockAccountRecord = {
    userId: 'test@example.com',
    recordKey: 'account#123',
    dataType: 'account',
    recordId: '123',
    data: {
      accountType: '401k',
      accountName: 'My 401k',
      institution: 'Vanguard',
      balance: 100000,
      asOfDate: '2024-01-01',
      status: 'active',
      notes: 'Test notes',
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/accounts/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/accounts/123');
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return account if it exists', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockAccountRecord as any);

      const request = new NextRequest('http://localhost:3000/api/accounts/123');
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.account).toBeDefined();
      expect(data.account.id).toBe('123');
      expect(data.account.accountName).toBe('My 401k');
      expect(mockGetUserData).toHaveBeenCalledWith('test@example.com', 'account', '123');
    });

    it('should return 404 if account does not exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/accounts/999');
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Account not found');
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/accounts/123');
      const response = await GET(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get account');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('PUT /api/accounts/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'PUT',
        body: JSON.stringify({ accountName: 'Updated Name' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if account does not exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/accounts/999', {
        method: 'PUT',
        body: JSON.stringify({ accountName: 'Updated Name' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Account not found');
    });

    it('should update account with valid data', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockAccountRecord as any);
      mockSaveUserData.mockResolvedValue('123');

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'PUT',
        body: JSON.stringify({
          accountName: 'Updated 401k',
          balance: 150000,
        }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.account).toBeDefined();
      expect(data.account.accountName).toBe('Updated 401k');
      expect(data.account.balance).toBe(150000);
      expect(data.account.institution).toBe('Vanguard'); // Unchanged
      expect(mockSaveUserData).toHaveBeenCalledWith(
        'test@example.com',
        'account',
        expect.objectContaining({
          accountName: 'Updated 401k',
          balance: 150000,
        }),
        '123'
      );
    });

    it('should return 400 if accountName is invalid', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockAccountRecord as any);

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'PUT',
        body: JSON.stringify({ accountName: '   ' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('accountName must be a non-empty string');
    });

    it('should return 400 if balance is negative', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockAccountRecord as any);

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'PUT',
        body: JSON.stringify({ balance: -1000 }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('balance must be a non-negative number');
    });

    it('should return 400 if balance is not a number', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockAccountRecord as any);

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'PUT',
        body: JSON.stringify({ balance: '50000' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('balance must be a non-negative number');
    });

    it('should return 400 if status is invalid', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockAccountRecord as any);

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'PUT',
        body: JSON.stringify({ status: 'invalid' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('status must be active or closed');
    });

    it('should update account status to closed', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockAccountRecord as any);
      mockSaveUserData.mockResolvedValue('123');

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'PUT',
        body: JSON.stringify({ status: 'closed' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.account.status).toBe('closed');
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockAccountRecord as any);
      mockSaveUserData.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'PUT',
        body: JSON.stringify({ accountName: 'Updated Name' }),
      });

      const response = await PUT(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to update account');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/accounts/[id]', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if account does not exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/accounts/999', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Account not found');
    });

    it('should delete account successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockAccountRecord as any);
      mockDeleteUserData.mockResolvedValue();

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockDeleteUserData).toHaveBeenCalledWith('test@example.com', 'account', '123');
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockAccountRecord as any);
      mockDeleteUserData.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/accounts/123', {
        method: 'DELETE',
      });

      const response = await DELETE(request, { params: Promise.resolve({ id: '123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to delete account');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
