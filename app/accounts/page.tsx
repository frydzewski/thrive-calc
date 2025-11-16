'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Account,
  AccountSummary,
  calculateAccountSummary,
  getAccountTypeLabel,
  getAccountCategory,
} from '../types/accounts';
import AccountModal from '../components/AccountModal';

export default function AccountsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchAccounts();
    }
  }, [session]);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounts');
      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts || []);
      } else {
        setError(data.error || 'Failed to load accounts');
      }
    } catch (err) {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setEditingAccount(null);
    setShowModal(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) {
      return;
    }

    try {
      setDeletingId(accountId);
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        await fetchAccounts();
      } else {
        alert(data.error || 'Failed to delete account');
      }
    } catch (err) {
      alert('Failed to delete account');
    } finally {
      setDeletingId(null);
    }
  };

  const handleModalClose = async (saved: boolean) => {
    setShowModal(false);
    setEditingAccount(null);
    if (saved) {
      await fetchAccounts();
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const summary = calculateAccountSummary(accounts);
  const activeAccounts = accounts.filter((a) => a.status === 'active');
  const closedAccounts = accounts.filter((a) => a.status === 'closed');

  // Group accounts by category
  const retirementAccounts = activeAccounts.filter(
    (a) => getAccountCategory(a.accountType) === 'retirement'
  );
  const investmentAccounts = activeAccounts.filter(
    (a) => getAccountCategory(a.accountType) === 'investment'
  );
  const cashAccounts = activeAccounts.filter((a) => getAccountCategory(a.accountType) === 'cash');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Accounts</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your retirement, investment, and cash accounts
          </p>
        </div>
        <button
          onClick={handleAddAccount}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
        >
          Add Account
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Total Net Worth</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-2">
            ${summary.totalNetWorth.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Retirement</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            ${summary.totalRetirement.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Investment</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            ${summary.totalInvestment.toLocaleString()}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Cash</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">
            ${summary.totalCash.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Retirement Accounts */}
      {retirementAccounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Retirement Accounts
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Institution
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                {retirementAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                      {account.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {getAccountTypeLabel(account.accountType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {account.institution || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-white font-medium">
                      ${account.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deletingId === account.id}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        {deletingId === account.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Investment Accounts */}
      {investmentAccounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Investment Accounts
          </h2>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Institution
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                {investmentAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                      {account.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {getAccountTypeLabel(account.accountType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {account.institution || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-white font-medium">
                      ${account.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deletingId === account.id}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        {deletingId === account.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cash Accounts */}
      {cashAccounts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">Cash Accounts</h2>
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Institution
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
                {cashAccounts.map((account) => (
                  <tr key={account.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                      {account.accountName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {getAccountTypeLabel(account.accountType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
                      {account.institution || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-zinc-900 dark:text-white font-medium">
                      ${account.balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditAccount(account)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account.id)}
                        disabled={deletingId === account.id}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                      >
                        {deletingId === account.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeAccounts.length === 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-12 text-center">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">
              No accounts yet
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Get started by adding your first retirement, investment, or cash account.
            </p>
            <button
              onClick={handleAddAccount}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              Add Your First Account
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AccountModal account={editingAccount} onClose={handleModalClose} />
      )}
    </div>
  );
}
