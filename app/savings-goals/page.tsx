'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface SavingsGoal {
  recordId: string;
  data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: string | null;
    monthlyContribution: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function SavingsGoals() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    monthlyContribution: 0
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  // Fetch goals on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchGoals();
    }
  }, [status]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/savings-goals');

      if (!response.ok) {
        throw new Error('Failed to fetch savings goals');
      }

      const data = await response.json();
      setGoals(data.goals || []);
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('Failed to load savings goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const calculateMonthsToGoal = (current: number, target: number, monthly: number) => {
    if (monthly <= 0) return Infinity;
    return Math.ceil((target - current) / monthly);
  };

  const addGoal = async () => {
    if (!newGoal.name || newGoal.targetAmount <= 0) {
      setError('Please provide a goal name and target amount greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/savings-goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newGoal.name,
          targetAmount: newGoal.targetAmount,
          currentAmount: newGoal.currentAmount,
          targetDate: newGoal.targetDate || null,
          monthlyContribution: newGoal.monthlyContribution,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create savings goal');
      }

      // Reset form and refresh goals
      setNewGoal({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: '',
        monthlyContribution: 0
      });
      setShowAddForm(false);
      await fetchGoals();
    } catch (err) {
      console.error('Error creating goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to create savings goal');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteGoal = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/savings-goals/${recordId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete savings goal');
      }

      await fetchGoals();
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete savings goal');
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Savings Goals
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={submitting}
        >
          {showAddForm ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {showAddForm && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            New Savings Goal
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Goal Name *
              </label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="e.g., New Car"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Target Amount *
              </label>
              <input
                type="number"
                value={newGoal.targetAmount || ''}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="10000"
                min="0"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Current Amount
              </label>
              <input
                type="number"
                value={newGoal.currentAmount || ''}
                onChange={(e) => setNewGoal({ ...newGoal, currentAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="0"
                min="0"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Monthly Contribution
              </label>
              <input
                type="number"
                value={newGoal.monthlyContribution || ''}
                onChange={(e) => setNewGoal({ ...newGoal, monthlyContribution: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="500"
                min="0"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Target Date
              </label>
              <input
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                disabled={submitting}
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={addGoal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.data.currentAmount, goal.data.targetAmount);
          const monthsToGoal = calculateMonthsToGoal(
            goal.data.currentAmount,
            goal.data.targetAmount,
            goal.data.monthlyContribution
          );

          return (
            <div
              key={goal.recordId}
              className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
                    {goal.data.name}
                  </h3>
                  {goal.data.targetDate && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Target: {new Date(goal.data.targetDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteGoal(goal.recordId)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    ${goal.data.currentAmount.toLocaleString()} of ${goal.data.targetAmount.toLocaleString()}
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {progress}%
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-zinc-600 dark:text-zinc-400 mb-1">
                    Monthly Contribution
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-white">
                    ${goal.data.monthlyContribution.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-600 dark:text-zinc-400 mb-1">
                    Remaining
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-white">
                    ${(goal.data.targetAmount - goal.data.currentAmount).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-600 dark:text-zinc-400 mb-1">
                    Months to Goal
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-white">
                    {monthsToGoal === Infinity ? 'N/A' : monthsToGoal}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {goals.length === 0 && !loading && (
          <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              No savings goals yet. Add one to get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
