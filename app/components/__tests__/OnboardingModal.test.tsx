import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OnboardingModal from '../OnboardingModal';

// Mock fetch
global.fetch = jest.fn();

describe('OnboardingModal', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({ success: true }),
    });
  });

  describe('rendering', () => {
    it('should render the modal with title and description', () => {
      render(<OnboardingModal onComplete={mockOnComplete} />);

      expect(screen.getByText('Welcome to ThriveCalc!')).toBeInTheDocument();
      expect(
        screen.getByText("Let's get started by learning a bit about you.")
      ).toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<OnboardingModal onComplete={mockOnComplete} />);

      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument();
      expect(screen.getByLabelText('Marital Status')).toBeInTheDocument();
      expect(screen.getByLabelText('Number of Dependents')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<OnboardingModal onComplete={mockOnComplete} />);

      expect(screen.getByRole('button', { name: 'Complete Profile' })).toBeInTheDocument();
    });

    it('should have first name field focused by default', () => {
      render(<OnboardingModal onComplete={mockOnComplete} />);

      expect(screen.getByLabelText('First Name')).toHaveFocus();
    });
  });

  describe('form validation', () => {
    it('should show error when first name is empty', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal onComplete={mockOnComplete} />);

      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      expect(screen.getByText('Please enter your first name')).toBeInTheDocument();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should show error when date of birth is empty', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal onComplete={mockOnComplete} />);

      const firstNameInput = screen.getByLabelText('First Name');
      await user.type(firstNameInput, 'John');

      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      expect(screen.getByText('Please enter your date of birth')).toBeInTheDocument();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should show error when age is less than 13', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal onComplete={mockOnComplete} />);

      // Calculate a date for someone who is 12 years old
      const today = new Date();
      const twelveyearsAgo = new Date(today.getFullYear() - 12, today.getMonth(), today.getDate());
      const dateString = twelveyearsAgo.toISOString().split('T')[0];

      const firstNameInput = screen.getByLabelText('First Name');
      await user.type(firstNameInput, 'John');

      const dobInput = screen.getByLabelText('Date of Birth');
      await user.type(dobInput, dateString);

      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      expect(
        screen.getByText('You must be at least 13 years old to use ThriveCalc')
      ).toBeInTheDocument();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should show error when age is greater than 120', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal onComplete={mockOnComplete} />);

      const firstNameInput = screen.getByLabelText('First Name');
      await user.type(firstNameInput, 'John');

      const dobInput = screen.getByLabelText('Date of Birth');
      await user.type(dobInput, '1850-01-01');

      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      expect(screen.getByText('Please enter a valid date of birth')).toBeInTheDocument();
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should accept valid form data', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal onComplete={mockOnComplete} />);

      const firstNameInput = screen.getByLabelText('First Name');
      await user.type(firstNameInput, 'John');

      const dobInput = screen.getByLabelText('Date of Birth');
      await user.type(dobInput, '1990-01-01');

      const maritalStatusSelect = screen.getByLabelText('Marital Status');
      await user.selectOptions(maritalStatusSelect, 'married');

      const dependentsInput = screen.getByLabelText('Number of Dependents');
      await user.clear(dependentsInput);
      await user.type(dependentsInput, '2');

      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firstname: 'John',
            dateOfBirth: '1990-01-01',
            maritalStatus: 'married',
            numberOfDependents: 2,
          }),
        });
      });
    });
  });

  describe('form submission', () => {
    it('should call onComplete with firstname on successful submission', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal onComplete={mockOnComplete} />);

      const firstNameInput = screen.getByLabelText('First Name');
      await user.type(firstNameInput, 'John');

      const dobInput = screen.getByLabelText('Date of Birth');
      await user.type(dobInput, '1990-01-01');

      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith('John');
      });
    });

    it('should trim whitespace from firstname before submission', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal onComplete={mockOnComplete} />);

      const firstNameInput = screen.getByLabelText('First Name');
      await user.type(firstNameInput, '  John  ');

      const dobInput = screen.getByLabelText('Date of Birth');
      await user.type(dobInput, '1990-01-01');

      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith('John');
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/profile',
        expect.objectContaining({
          body: JSON.stringify({
            firstname: 'John',
            dateOfBirth: '1990-01-01',
            maritalStatus: 'single',
            numberOfDependents: 0,
          }),
        })
      );
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as jest.Mock).mockReturnValue(promise);

      render(<OnboardingModal onComplete={mockOnComplete} />);

      const firstNameInput = screen.getByLabelText('First Name');
      await user.type(firstNameInput, 'John');

      const dobInput = screen.getByLabelText('Date of Birth');
      await user.type(dobInput, '1990-01-01');

      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      // Button should show loading state
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Saving...' })).toBeDisabled();

      // Form fields should be disabled
      expect(firstNameInput).toBeDisabled();
      expect(dobInput).toBeDisabled();

      // Resolve the promise
      resolvePromise!({ json: () => Promise.resolve({ success: true }) });

      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalled();
      });
    });

    it('should display error message on API failure', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({
          success: false,
          error: 'Database error',
        }),
      });

      render(<OnboardingModal onComplete={mockOnComplete} />);

      const firstNameInput = screen.getByLabelText('First Name');
      await user.type(firstNameInput, 'John');

      const dobInput = screen.getByLabelText('Date of Birth');
      await user.type(dobInput, '1990-01-01');

      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Database error')).toBeInTheDocument();
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should display generic error message on network failure', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<OnboardingModal onComplete={mockOnComplete} />);

      const firstNameInput = screen.getByLabelText('First Name');
      await user.type(firstNameInput, 'John');

      const dobInput = screen.getByLabelText('Date of Birth');
      await user.type(dobInput, '1990-01-01');

      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should clear previous errors on new submission', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal onComplete={mockOnComplete} />);

      // First submission with empty form
      const submitButton = screen.getByRole('button', { name: 'Complete Profile' });
      await user.click(submitButton);

      expect(screen.getByText('Please enter your first name')).toBeInTheDocument();

      // Fill in the form
      const firstNameInput = screen.getByLabelText('First Name');
      await user.type(firstNameInput, 'John');

      const dobInput = screen.getByLabelText('Date of Birth');
      await user.type(dobInput, '1990-01-01');

      // Second submission
      await user.click(submitButton);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Please enter your first name')).not.toBeInTheDocument();
      });
    });
  });

  describe('marital status selection', () => {
    it('should allow selecting all marital status options', async () => {
      const user = userEvent.setup();
      render(<OnboardingModal onComplete={mockOnComplete} />);

      const maritalStatusSelect = screen.getByLabelText('Marital Status') as HTMLSelectElement;

      expect(maritalStatusSelect.value).toBe('single');

      await user.selectOptions(maritalStatusSelect, 'married');
      expect(maritalStatusSelect.value).toBe('married');

      await user.selectOptions(maritalStatusSelect, 'divorced');
      expect(maritalStatusSelect.value).toBe('divorced');

      await user.selectOptions(maritalStatusSelect, 'widowed');
      expect(maritalStatusSelect.value).toBe('widowed');
    });
  });
});
