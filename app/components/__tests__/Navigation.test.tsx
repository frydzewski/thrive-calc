import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Navigation from '../Navigation';

// Mock fetch
global.fetch = jest.fn();

describe('Navigation', () => {
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
  const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>;
  const mockSignIn = signIn as jest.MockedFunction<typeof signIn>;
  const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: false }),
    });
  });

  describe('when user is unauthenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('should render the navigation bar', () => {
      render(<Navigation />);
      expect(screen.getByText('FinPlan')).toBeInTheDocument();
    });

    it('should render all navigation items', () => {
      render(<Navigation />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Accounts')).toBeInTheDocument();
      expect(screen.getByText('Scenarios')).toBeInTheDocument();
      expect(screen.getByText('Savings Goals')).toBeInTheDocument();
      expect(screen.getByText('Portfolio')).toBeInTheDocument();
      expect(screen.getByText('Reports')).toBeInTheDocument();
    });

    it('should show Sign In button when unauthenticated', () => {
      render(<Navigation />);
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should call signIn with "cognito" when Sign In button is clicked', () => {
      render(<Navigation />);

      const signInButton = screen.getByText('Sign In');
      fireEvent.click(signInButton);

      expect(mockSignIn).toHaveBeenCalledWith('cognito');
    });

    it('should not show Profile or Sign Out buttons', () => {
      render(<Navigation />);

      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  describe('when user is authenticated', () => {
    const mockSession = {
      user: {
        name: 'Test User',
        email: 'test@example.com',
        image: 'https://example.com/avatar.jpg',
      },
      expires: '2024-12-31',
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: mockSession,
        status: 'authenticated',
        update: jest.fn(),
      });
    });

    it('should show user information', async () => {
      render(<Navigation />);
      expect(screen.getByText('Test User')).toBeInTheDocument();

      // Wait for async state updates to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should show Profile and Sign Out buttons', async () => {
      render(<Navigation />);

      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Sign Out')).toBeInTheDocument();

      // Wait for async state updates to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should not show Sign In button', async () => {
      render(<Navigation />);
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();

      // Wait for async state updates to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should call signOut when Sign Out button is clicked', async () => {
      render(<Navigation />);

      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      expect(mockSignOut).toHaveBeenCalled();

      // Wait for async state updates to complete
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });

    it('should fetch user profile when authenticated', async () => {
      const mockProfileData = {
        success: true,
        profile: {
          username: 'test@example.com',
          firstname: 'John',
          dateOfBirth: '1990-01-01',
          maritalStatus: 'single',
          numberOfDependents: 0,
          onboardingComplete: true,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockProfileData),
      });

      render(<Navigation />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/profile');
      });
    });

    it('should display firstname from profile when available', async () => {
      const mockProfileData = {
        success: true,
        profile: {
          username: 'test@example.com',
          firstname: 'John',
          dateOfBirth: '1990-01-01',
          maritalStatus: 'single',
          numberOfDependents: 0,
          onboardingComplete: true,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockProfileData),
      });

      render(<Navigation />);

      await waitFor(() => {
        expect(screen.getByText('Welcome, John')).toBeInTheDocument();
      });
    });

    it('should handle profile fetch error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<Navigation />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to fetch profile:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('when session is loading', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: jest.fn(),
      });
    });

    it('should show loading state', () => {
      const { container } = render(<Navigation />);

      // Check for loading spinner (pulsing element)
      const loadingElement = container.querySelector('.animate-pulse');
      expect(loadingElement).toBeInTheDocument();
    });

    it('should not show Sign In, Profile, or Sign Out buttons', () => {
      render(<Navigation />);

      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Profile')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Out')).not.toBeInTheDocument();
    });
  });

  describe('active navigation state', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('should highlight Dashboard when on home page', () => {
      mockUsePathname.mockReturnValue('/');
      const { container } = render(<Navigation />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('bg-blue-50');
    });

    it('should highlight Accounts when on accounts page', () => {
      mockUsePathname.mockReturnValue('/accounts');
      const { container } = render(<Navigation />);

      const accountsLink = screen.getByText('Accounts').closest('a');
      expect(accountsLink).toHaveClass('bg-blue-50');
    });

    it('should highlight Scenarios when on scenarios page', () => {
      mockUsePathname.mockReturnValue('/scenarios');
      const { container } = render(<Navigation />);

      const scenariosLink = screen.getByText('Scenarios').closest('a');
      expect(scenariosLink).toHaveClass('bg-blue-50');
    });

    it('should not highlight any link when on an unknown page', () => {
      mockUsePathname.mockReturnValue('/unknown');
      const { container } = render(<Navigation />);

      const activeLinks = container.querySelectorAll('.bg-blue-50');
      expect(activeLinks).toHaveLength(0);
    });
  });

  describe('navigation links', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'unauthenticated',
        update: jest.fn(),
      });
    });

    it('should have correct href attributes', () => {
      render(<Navigation />);

      expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/');
      expect(screen.getByText('Accounts').closest('a')).toHaveAttribute('href', '/accounts');
      expect(screen.getByText('Scenarios').closest('a')).toHaveAttribute('href', '/scenarios');
      expect(screen.getByText('Savings Goals').closest('a')).toHaveAttribute('href', '/savings-goals');
      expect(screen.getByText('Portfolio').closest('a')).toHaveAttribute('href', '/portfolio');
      expect(screen.getByText('Reports').closest('a')).toHaveAttribute('href', '/reports');
    });

    it('should have FinPlan logo link to home', () => {
      render(<Navigation />);

      const logoLink = screen.getByText('FinPlan').closest('a');
      expect(logoLink).toHaveAttribute('href', '/');
    });
  });
});
