/**
 * Tests for profile API route
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT } from '../route';
import { getUserData, saveUserData } from '@/app/lib/data-store';
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
}));

const mockGetUserData = getUserData as jest.MockedFunction<typeof getUserData>;
const mockSaveUserData = saveUserData as jest.MockedFunction<typeof saveUserData>;
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('Profile API Route', () => {
  const mockSession = {
    user: {
      email: 'test@example.com',
    },
  };

  const mockProfileRecord = {
    userId: 'test@example.com',
    recordKey: 'user-profile#profile',
    dataType: 'user-profile',
    recordId: 'profile',
    data: {
      firstname: 'John',
      dateOfBirth: '1990-01-15',
      maritalStatus: 'married',
      numberOfDependents: 2,
      onboardingComplete: true,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Set fake timers for consistent age calculation
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('GET /api/profile', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return profile if it exists', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockProfileRecord as any);

      const request = new NextRequest('http://localhost:3000/api/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile).toBeDefined();
      expect(data.profile.firstname).toBe('John');
      expect(data.profile.currentAge).toBe(34); // 2024 - 1990
      expect(mockGetUserData).toHaveBeenCalledWith('test@example.com', 'user-profile', 'profile');
    });

    it('should return undefined profile if it does not exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile).toBeUndefined();
    });

    it('should handle errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/profile');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get profile');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('POST /api/profile', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstname: 'John',
          dateOfBirth: '1990-01-15',
          maritalStatus: 'married',
          numberOfDependents: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should create a new profile with valid data', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockSaveUserData.mockResolvedValue('profile');

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstname: 'John',
          dateOfBirth: '1990-01-15',
          maritalStatus: 'married',
          numberOfDependents: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile).toBeDefined();
      expect(data.profile.firstname).toBe('John');
      expect(data.profile.currentAge).toBe(34);
      expect(data.profile.onboardingComplete).toBe(true);
      expect(mockSaveUserData).toHaveBeenCalledWith(
        'test@example.com',
        'user-profile',
        expect.objectContaining({
          firstname: 'John',
          dateOfBirth: '1990-01-15',
          maritalStatus: 'married',
          numberOfDependents: 2,
          onboardingComplete: true,
        }),
        'profile'
      );
    });

    it('should return 400 if firstname is missing', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          dateOfBirth: '1990-01-15',
          maritalStatus: 'married',
          numberOfDependents: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('firstname is required');
    });

    it('should return 400 if firstname is empty', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstname: '   ',
          dateOfBirth: '1990-01-15',
          maritalStatus: 'married',
          numberOfDependents: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('firstname is required');
    });

    it('should return 400 if dateOfBirth is missing', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstname: 'John',
          maritalStatus: 'married',
          numberOfDependents: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('dateOfBirth is required');
    });

    it('should return 400 if maritalStatus is invalid', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstname: 'John',
          dateOfBirth: '1990-01-15',
          maritalStatus: 'invalid',
          numberOfDependents: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Valid maritalStatus is required');
    });

    it('should return 400 if numberOfDependents is negative', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstname: 'John',
          dateOfBirth: '1990-01-15',
          maritalStatus: 'married',
          numberOfDependents: -1,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('numberOfDependents must be between 0 and 20');
    });

    it('should return 400 if numberOfDependents is too high', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstname: 'John',
          dateOfBirth: '1990-01-15',
          maritalStatus: 'married',
          numberOfDependents: 25,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('numberOfDependents must be between 0 and 20');
    });

    it('should return 400 if age is too young', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstname: 'John',
          dateOfBirth: '2020-01-15', // Age 4
          maritalStatus: 'single',
          numberOfDependents: 0,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid date of birth');
    });

    it('should return 400 if age is too old', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstname: 'John',
          dateOfBirth: '1800-01-15', // Age 224
          maritalStatus: 'single',
          numberOfDependents: 0,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid date of birth');
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockSaveUserData.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          firstname: 'John',
          dateOfBirth: '1990-01-15',
          maritalStatus: 'married',
          numberOfDependents: 2,
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to save profile');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('PUT /api/profile', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstname: 'Jane',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 if profile does not exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstname: 'Jane',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Profile not found');
    });

    it('should update profile with valid data', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockProfileRecord as any);
      mockSaveUserData.mockResolvedValue('profile');

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstname: 'Jane',
          numberOfDependents: 3,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.profile).toBeDefined();
      expect(data.profile.firstname).toBe('Jane');
      expect(data.profile.numberOfDependents).toBe(3);
      expect(data.profile.maritalStatus).toBe('married'); // Unchanged
      expect(mockSaveUserData).toHaveBeenCalledWith(
        'test@example.com',
        'user-profile',
        expect.objectContaining({
          firstname: 'Jane',
          numberOfDependents: 3,
          maritalStatus: 'married',
        }),
        'profile'
      );
    });

    it('should return 400 if firstname is invalid', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockProfileRecord as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstname: '   ',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid firstname');
    });

    it('should return 400 if dateOfBirth is invalid', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockProfileRecord as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          dateOfBirth: 123, // Not a string
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid dateOfBirth');
    });

    it('should return 400 if age is invalid', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockProfileRecord as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          dateOfBirth: '2020-01-15', // Age 4
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid date of birth');
    });

    it('should return 400 if maritalStatus is invalid', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockProfileRecord as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          maritalStatus: 'invalid',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid maritalStatus');
    });

    it('should return 400 if numberOfDependents is invalid', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockProfileRecord as any);

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          numberOfDependents: 25,
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid numberOfDependents');
    });

    it('should handle database errors gracefully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession as any);
      mockGetUserData.mockResolvedValue(mockProfileRecord as any);
      mockSaveUserData.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstname: 'Jane',
        }),
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to update profile');
      expect(console.error).toHaveBeenCalled();
    });
  });
});
