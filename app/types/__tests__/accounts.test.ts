/**
 * Tests for account utility functions
 */

import {
  getAccountTypeLabel,
  getAccountCategory,
  calculateAccountSummary,
  Account,
  AccountType,
} from '../accounts';

describe('Account Utilities', () => {
  describe('getAccountTypeLabel', () => {
    it('should return correct label for 401k', () => {
      expect(getAccountTypeLabel('401k')).toBe('401(k)');
    });

    it('should return correct label for traditional IRA', () => {
      expect(getAccountTypeLabel('traditional-ira')).toBe('Traditional IRA');
    });

    it('should return correct label for Roth IRA', () => {
      expect(getAccountTypeLabel('roth-ira')).toBe('Roth IRA');
    });

    it('should return correct label for brokerage', () => {
      expect(getAccountTypeLabel('brokerage')).toBe('Brokerage');
    });

    it('should return correct label for savings', () => {
      expect(getAccountTypeLabel('savings')).toBe('Savings');
    });

    it('should return correct label for checking', () => {
      expect(getAccountTypeLabel('checking')).toBe('Checking');
    });
  });

  describe('getAccountCategory', () => {
    it('should categorize 401k as retirement', () => {
      expect(getAccountCategory('401k')).toBe('retirement');
    });

    it('should categorize traditional IRA as retirement', () => {
      expect(getAccountCategory('traditional-ira')).toBe('retirement');
    });

    it('should categorize Roth IRA as retirement', () => {
      expect(getAccountCategory('roth-ira')).toBe('retirement');
    });

    it('should categorize brokerage as investment', () => {
      expect(getAccountCategory('brokerage')).toBe('investment');
    });

    it('should categorize savings as cash', () => {
      expect(getAccountCategory('savings')).toBe('cash');
    });

    it('should categorize checking as cash', () => {
      expect(getAccountCategory('checking')).toBe('cash');
    });
  });

  describe('calculateAccountSummary', () => {
    const sampleAccounts: Account[] = [
      {
        id: '1',
        username: 'test@example.com',
        accountType: '401k',
        accountName: 'Employer 401k',
        institution: 'Vanguard',
        balance: 100000,
        asOfDate: '2024-01-01',
        status: 'active',
      },
      {
        id: '2',
        username: 'test@example.com',
        accountType: 'roth-ira',
        accountName: 'Roth IRA',
        institution: 'Fidelity',
        balance: 50000,
        asOfDate: '2024-01-01',
        status: 'active',
      },
      {
        id: '3',
        username: 'test@example.com',
        accountType: 'brokerage',
        accountName: 'Taxable Account',
        institution: 'Charles Schwab',
        balance: 75000,
        asOfDate: '2024-01-01',
        status: 'active',
      },
      {
        id: '4',
        username: 'test@example.com',
        accountType: 'savings',
        accountName: 'Emergency Fund',
        institution: 'Chase',
        balance: 30000,
        asOfDate: '2024-01-01',
        status: 'active',
      },
      {
        id: '5',
        username: 'test@example.com',
        accountType: 'checking',
        accountName: 'Checking',
        institution: 'Chase',
        balance: 10000,
        asOfDate: '2024-01-01',
        status: 'active',
      },
    ];

    it('should calculate correct total retirement', () => {
      const summary = calculateAccountSummary(sampleAccounts);
      expect(summary.totalRetirement).toBe(150000); // 100k + 50k
    });

    it('should calculate correct total investment', () => {
      const summary = calculateAccountSummary(sampleAccounts);
      expect(summary.totalInvestment).toBe(75000);
    });

    it('should calculate correct total cash', () => {
      const summary = calculateAccountSummary(sampleAccounts);
      expect(summary.totalCash).toBe(40000); // 30k + 10k
    });

    it('should calculate correct total net worth', () => {
      const summary = calculateAccountSummary(sampleAccounts);
      expect(summary.totalNetWorth).toBe(265000); // 150k + 75k + 40k
    });

    it('should count correct number of accounts', () => {
      const summary = calculateAccountSummary(sampleAccounts);
      expect(summary.accountCount).toBe(5);
    });

    it('should aggregate by account type correctly', () => {
      const summary = calculateAccountSummary(sampleAccounts);

      expect(summary.byType['401k'].count).toBe(1);
      expect(summary.byType['401k'].total).toBe(100000);

      expect(summary.byType['roth-ira'].count).toBe(1);
      expect(summary.byType['roth-ira'].total).toBe(50000);

      expect(summary.byType['brokerage'].count).toBe(1);
      expect(summary.byType['brokerage'].total).toBe(75000);

      expect(summary.byType['savings'].count).toBe(1);
      expect(summary.byType['savings'].total).toBe(30000);

      expect(summary.byType['checking'].count).toBe(1);
      expect(summary.byType['checking'].total).toBe(10000);
    });

    it('should handle empty accounts array', () => {
      const summary = calculateAccountSummary([]);

      expect(summary.totalRetirement).toBe(0);
      expect(summary.totalInvestment).toBe(0);
      expect(summary.totalCash).toBe(0);
      expect(summary.totalNetWorth).toBe(0);
      expect(summary.accountCount).toBe(0);
    });

    it('should exclude closed accounts from totals', () => {
      const accountsWithClosed: Account[] = [
        ...sampleAccounts,
        {
          id: '6',
          username: 'test@example.com',
          accountType: '401k',
          accountName: 'Old 401k',
          institution: 'Former Employer',
          balance: 50000,
          asOfDate: '2020-01-01',
          status: 'closed',
        },
      ];

      const summary = calculateAccountSummary(accountsWithClosed);

      // Should still be 150k (not 200k)
      expect(summary.totalRetirement).toBe(150000);

      // Total net worth should not include closed account
      expect(summary.totalNetWorth).toBe(265000);

      // Account count should include closed account in total count
      expect(summary.accountCount).toBe(6);

      // Closed account should not be counted in byType
      expect(summary.byType['401k'].count).toBe(1); // Only active 401k
      expect(summary.byType['401k'].total).toBe(100000); // Only active 401k balance
    });

    it('should handle multiple accounts of same type', () => {
      const multipleAccounts: Account[] = [
        {
          id: '1',
          username: 'test@example.com',
          accountType: '401k',
          accountName: 'Current 401k',
          balance: 100000,
          asOfDate: '2024-01-01',
          status: 'active',
        },
        {
          id: '2',
          username: 'test@example.com',
          accountType: '401k',
          accountName: 'Rollover 401k',
          balance: 150000,
          asOfDate: '2024-01-01',
          status: 'active',
        },
      ];

      const summary = calculateAccountSummary(multipleAccounts);

      expect(summary.byType['401k'].count).toBe(2);
      expect(summary.byType['401k'].total).toBe(250000);
      expect(summary.totalRetirement).toBe(250000);
    });

    it('should handle zero balance accounts', () => {
      const zeroBalanceAccounts: Account[] = [
        {
          id: '1',
          username: 'test@example.com',
          accountType: 'checking',
          accountName: 'Empty Checking',
          balance: 0,
          asOfDate: '2024-01-01',
          status: 'active',
        },
      ];

      const summary = calculateAccountSummary(zeroBalanceAccounts);

      expect(summary.totalCash).toBe(0);
      expect(summary.totalNetWorth).toBe(0);
      expect(summary.byType['checking'].count).toBe(1);
      expect(summary.byType['checking'].total).toBe(0);
    });

    it('should handle negative balances (debt)', () => {
      const accountsWithDebt: Account[] = [
        {
          id: '1',
          username: 'test@example.com',
          accountType: 'checking',
          accountName: 'Overdrawn Checking',
          balance: -500,
          asOfDate: '2024-01-01',
          status: 'active',
        },
        {
          id: '2',
          username: 'test@example.com',
          accountType: 'savings',
          accountName: 'Savings',
          balance: 10000,
          asOfDate: '2024-01-01',
          status: 'active',
        },
      ];

      const summary = calculateAccountSummary(accountsWithDebt);

      expect(summary.totalCash).toBe(9500); // 10000 - 500
      expect(summary.totalNetWorth).toBe(9500);
    });

    it('should handle all account types', () => {
      const allTypes: AccountType[] = [
        '401k',
        'traditional-ira',
        'roth-ira',
        'brokerage',
        'savings',
        'checking',
      ];

      const accounts: Account[] = allTypes.map((type, index) => ({
        id: String(index),
        username: 'test@example.com',
        accountType: type,
        accountName: `Account ${index}`,
        balance: 10000,
        asOfDate: '2024-01-01',
        status: 'active',
      }));

      const summary = calculateAccountSummary(accounts);

      // Retirement: 401k, traditional-ira, roth-ira = 30k
      expect(summary.totalRetirement).toBe(30000);

      // Investment: brokerage = 10k
      expect(summary.totalInvestment).toBe(10000);

      // Cash: savings, checking = 20k
      expect(summary.totalCash).toBe(20000);

      // Total: 60k
      expect(summary.totalNetWorth).toBe(60000);

      // All types should have count of 1
      allTypes.forEach((type) => {
        expect(summary.byType[type].count).toBe(1);
        expect(summary.byType[type].total).toBe(10000);
      });
    });
  });
});
