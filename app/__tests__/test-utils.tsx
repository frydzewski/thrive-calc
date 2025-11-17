import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock session data for testing authenticated states
export const mockAuthenticatedSession = {
  user: {
    name: 'Test User',
    email: 'test@example.com',
    image: 'https://example.com/avatar.jpg',
  },
  expires: '2024-12-31',
};

// Mock unauthenticated session
export const mockUnauthenticatedSession = null;

// Mock profile data
export const mockUserProfile = {
  username: 'test@example.com',
  firstname: 'John',
  dateOfBirth: '1990-01-01',
  maritalStatus: 'single' as const,
  numberOfDependents: 0,
  currentAge: 35,
  onboardingComplete: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock account data
export const mockAccount = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Checking Account',
  type: 'checking' as const,
  balance: 5000,
  institution: 'Test Bank',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Mock scenario data
export const mockScenario = {
  id: '550e8400-e29b-41d4-a716-446655440001',
  name: 'Base Scenario',
  retirementAge: 65,
  currentAge: 35,
  lifExpectancy: 85,
  inflationRate: 2.5,
  isDefault: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

// Helper to create mock fetch response
export function mockFetchResponse<T>(data: T, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 400,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response);
}

// Helper to create mock fetch error
export function mockFetchError(message: string) {
  return Promise.reject(new Error(message));
}

// Custom render function that can be extended with providers
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { ...options });
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
