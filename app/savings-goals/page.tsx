'use client';

import { useState } from 'react';

interface SavingsGoal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  monthlyContribution: number;
}

export default function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([
    {
      id: 1,
      name: 'Emergency Fund',
      targetAmount: 20000,
      currentAmount: 15000,
      targetDate: '2025-12-31',
      monthlyContribution: 500
    },
    {
      id: 2,
      name: 'House Down Payment',
      targetAmount: 60000,
      currentAmount: 42000,
      targetDate: '2026-06-30',
      monthlyContribution: 1200
    },
    {
      id: 3,
      name: 'Vacation Fund',
      targetAmount: 5000,
      currentAmount: 2800,
      targetDate: '2025-06-15',
      monthlyContribution: 300
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    monthlyContribution: 0
  });

  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const calculateMonthsToGoal = (current: number, target: number, monthly: number) => {
    if (monthly <= 0) return Infinity;
    return Math.ceil((target - current) / monthly);
  };

  const addGoal = () => {
    if (newGoal.name && newGoal.targetAmount > 0) {
      const goal: SavingsGoal = {
        id: Date.now(),
        ...newGoal
      };
      setGoals([...goals, goal]);
      setNewGoal({
        name: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: '',
        monthlyContribution: 0
      });
      setShowAddForm(false);
    }
  };

  const deleteGoal = (id: number) => {
    setGoals(goals.filter(goal => goal.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Savings Goals
        </h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'Cancel' : '+ Add Goal'}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            New Savings Goal
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Goal Name
              </label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="e.g., New Car"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Target Amount
              </label>
              <input
                type="number"
                value={newGoal.targetAmount || ''}
                onChange={(e) => setNewGoal({ ...newGoal, targetAmount: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                placeholder="10000"
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
              />
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={addGoal}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Save Goal
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
          const monthsToGoal = calculateMonthsToGoal(
            goal.currentAmount,
            goal.targetAmount,
            goal.monthlyContribution
          );

          return (
            <div
              key={goal.id}
              className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-zinc-900 dark:text-white mb-1">
                    {goal.name}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    ${goal.currentAmount.toLocaleString()} of ${goal.targetAmount.toLocaleString()}
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
                    ${goal.monthlyContribution.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-600 dark:text-zinc-400 mb-1">
                    Remaining
                  </div>
                  <div className="font-medium text-zinc-900 dark:text-white">
                    ${(goal.targetAmount - goal.currentAmount).toLocaleString()}
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

        {goals.length === 0 && (
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
