'use client';

import { useState, useEffect } from 'react';
import { Account, AccountType, getAccountTypeLabel } from '../types/accounts';

interface AccountModalProps {
  account: Account | null; // null for new account, populated for edit
  onClose: (saved: boolean) => void;
}

export default function AccountModal({ account, onClose }: AccountModalProps) {
  const isEditing = account !== null;

  const [accountType, setAccountType] = useState<AccountType>(account?.accountType || '401k');
  const [accountName, setAccountName] = useState(account?.accountName || '');
  const [institution, setInstitution] = useState(account?.institution || '');
  const [balance, setBalance] = useState(account?.balance.toString() || '');
  const [asOfDate, setAsOfDate] = useState(
    account?.asOfDate || new Date().toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(account?.notes || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accountTypes: AccountType[] = [
    '401k',
    'traditional-ira',
    'roth-ira',
    'brokerage',
    'savings',
    'checking',
  ];

  const validateForm = (): string | null => {
    if (!accountName.trim()) {
      return 'Account name is required';
    }

    const balanceNum = parseFloat(balance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      return 'Please enter a valid balance (0 or greater)';
    }

    if (!asOfDate) {
      return 'As of date is required';
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
      const url = isEditing ? `/api/accounts/${account.id}` : '/api/accounts';
      const method = isEditing ? 'PUT' : 'POST';

      const body: any = {
        accountName: accountName.trim(),
        institution: institution.trim() || undefined,
        balance: parseFloat(balance),
        asOfDate,
        notes: notes.trim() || undefined,
      };

      // Only include accountType when creating (not editing)
      if (!isEditing) {
        body.accountType = accountType;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save account');
      }

      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {isEditing ? 'Edit Account' : 'Add New Account'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {!isEditing && (
            <div>
              <label
                htmlFor="accountType"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Account Type
              </label>
              <select
                id="accountType"
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
                disabled={isLoading}
              >
                {accountTypes.map((type) => (
                  <option key={type} value={type}>
                    {getAccountTypeLabel(type)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              htmlFor="accountName"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Account Name *
            </label>
            <input
              type="text"
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              placeholder="e.g., Vanguard 401k, Emergency Fund"
              disabled={isLoading}
              required
            />
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              A friendly name to identify this account
            </p>
          </div>

          <div>
            <label
              htmlFor="institution"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Institution
            </label>
            <input
              type="text"
              id="institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              placeholder="e.g., Vanguard, Fidelity, Chase"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="balance"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Current Balance *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-zinc-500 dark:text-zinc-400">$</span>
                <input
                  type="number"
                  id="balance"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full pl-7 pr-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="asOfDate"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                As of Date *
              </label>
              <input
                type="date"
                id="asOfDate"
                value={asOfDate}
                onChange={(e) => setAsOfDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
                disabled={isLoading}
                required
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              placeholder="Any additional information about this account..."
              rows={3}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
