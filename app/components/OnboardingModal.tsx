'use client';

import { useState } from 'react';
import { MaritalStatus } from '../types/profile';

interface OnboardingModalProps {
  onComplete: (firstname: string) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [firstname, setFirstname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('single');
  const [numberOfDependents, setNumberOfDependents] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const validateForm = (): string | null => {
    if (!firstname.trim()) {
      return 'Please enter your first name';
    }
    if (!dateOfBirth) {
      return 'Please enter your date of birth';
    }

    const age = calculateAge(dateOfBirth);
    if (age < 13) {
      return 'You must be at least 13 years old to use ThriveCalc';
    }
    if (age > 120) {
      return 'Please enter a valid date of birth';
    }

    const dependents = parseInt(numberOfDependents);
    if (isNaN(dependents) || dependents < 0 || dependents > 20) {
      return 'Please enter a valid number of dependents (0-20)';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname: firstname.trim(),
          dateOfBirth,
          maritalStatus,
          numberOfDependents: parseInt(numberOfDependents),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save profile');
      }

      onComplete(firstname.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
          Welcome to ThriveCalc!
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mb-6">
          Let's get started by learning a bit about you.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="firstname"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstname"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              placeholder="Enter your first name"
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="maritalStatus"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Marital Status
            </label>
            <select
              id="maritalStatus"
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              disabled={isLoading}
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="numberOfDependents"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Number of Dependents
            </label>
            <input
              type="number"
              id="numberOfDependents"
              value={numberOfDependents}
              onChange={(e) => setNumberOfDependents(e.target.value)}
              min="0"
              max="20"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
