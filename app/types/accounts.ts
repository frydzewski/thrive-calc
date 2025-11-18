export type AccountType =
  | '401k'
  | 'traditional-ira'
  | 'roth-ira'
  | 'brokerage'
  | 'savings'
  | 'checking';

export type AccountStatus = 'active' | 'closed';

export interface Account {
  id: string; // UUID
  userId: string; // Cognito sub ID
  accountType: AccountType;
  accountName: string; // User-friendly name like "Vanguard 401k" or "Emergency Fund"
  institution?: string; // Bank/brokerage name
  balance: number;
  asOfDate: string; // ISO date format - when was this balance recorded
  status: AccountStatus;

  // Optional metadata
  notes?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAccountRequest {
  accountType: AccountType;
  accountName: string;
  institution?: string;
  balance: number;
  asOfDate: string;
  notes?: string;
}

export interface UpdateAccountRequest {
  accountName?: string;
  institution?: string;
  balance?: number;
  asOfDate?: string;
  status?: AccountStatus;
  notes?: string;
}

export interface AccountResponse {
  success: boolean;
  account?: Account;
  error?: string;
}

export interface AccountsListResponse {
  success: boolean;
  accounts?: Account[];
  error?: string;
}

// Helper to get display name for account types
export function getAccountTypeLabel(accountType: AccountType): string {
  const labels: Record<AccountType, string> = {
    '401k': '401(k)',
    'traditional-ira': 'Traditional IRA',
    'roth-ira': 'Roth IRA',
    'brokerage': 'Brokerage',
    'savings': 'Savings',
    'checking': 'Checking',
  };
  return labels[accountType];
}

// Helper to categorize accounts
export type AccountCategory = 'retirement' | 'investment' | 'cash';

export function getAccountCategory(accountType: AccountType): AccountCategory {
  if (accountType === '401k' || accountType === 'traditional-ira' || accountType === 'roth-ira') {
    return 'retirement';
  }
  if (accountType === 'brokerage') {
    return 'investment';
  }
  return 'cash';
}

// Summary by category
export interface AccountSummary {
  totalRetirement: number;
  totalInvestment: number;
  totalCash: number;
  totalNetWorth: number;
  accountCount: number;
  byType: Record<AccountType, { count: number; total: number }>;
}

export function calculateAccountSummary(accounts: Account[]): AccountSummary {
  const summary: AccountSummary = {
    totalRetirement: 0,
    totalInvestment: 0,
    totalCash: 0,
    totalNetWorth: 0,
    accountCount: accounts.length,
    byType: {
      '401k': { count: 0, total: 0 },
      'traditional-ira': { count: 0, total: 0 },
      'roth-ira': { count: 0, total: 0 },
      'brokerage': { count: 0, total: 0 },
      'savings': { count: 0, total: 0 },
      'checking': { count: 0, total: 0 },
    },
  };

  accounts.forEach((account) => {
    if (account.status === 'closed') return; // Don't count closed accounts

    const category = getAccountCategory(account.accountType);

    // Add to category totals
    if (category === 'retirement') {
      summary.totalRetirement += account.balance;
    } else if (category === 'investment') {
      summary.totalInvestment += account.balance;
    } else {
      summary.totalCash += account.balance;
    }

    // Add to type totals
    summary.byType[account.accountType].count++;
    summary.byType[account.accountType].total += account.balance;
  });

  summary.totalNetWorth = summary.totalRetirement + summary.totalInvestment + summary.totalCash;

  return summary;
}
