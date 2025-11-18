/**
 * Projection Calculator Tests
 *
 * Comprehensive tests for financial projection calculations including:
 * - Income vs Withdrawals separation
 * - Inflation calculations
 * - Investment returns
 * - Account withdrawal logic
 * - Required Minimum Distributions (RMDs)
 * - Contributions
 * - Edge cases
 */

import { calculateScenarioProjection, calculateAge } from '../../types/projections';
import { Scenario } from '../../types/scenarios';
import { UserProfile } from '../../types/profile';
import { Account } from '../../types/accounts';

describe('Projection Calculator', () => {
  // Helper to create a basic user profile
  const createTestProfile = (age: number = 35): UserProfile => {
    const birthYear = new Date().getFullYear() - age;
    return {
      userId: 'test-user-123',
      firstname: 'Test',
      dateOfBirth: `${birthYear}-01-01`,
      maritalStatus: 'single',
      numberOfDependents: 0,
      onboardingComplete: true,
      currentAge: age,
    };
  };

  // Helper to create basic accounts
  const createTestAccounts = (): Account[] => [
    {
      id: 'checking-1',
      userId: 'test-user-123',
      accountType: 'checking',
      accountName: 'Checking',
      balance: 10000,
      asOfDate: '2025-01-01',
      status: 'active',
    },
    {
      id: '401k-1',
      userId: 'test-user-123',
      accountType: '401k',
      accountName: '401k',
      balance: 100000,
      asOfDate: '2025-01-01',
      status: 'active',
    },
  ];

  // Helper to create a basic scenario
  const createTestScenario = (overrides?: Partial<Scenario>): Scenario => ({
    id: 'scenario-1',
    userId: 'test-user-123',
    name: 'Test Scenario',
    isDefault: false,
    retirementAge: 65,
    socialSecurityAge: 67,
    socialSecurityIncome: 24000,
    investmentReturnRate: 7,
    inflationRate: 3,
    assumptionBuckets: [
      {
        id: 'bucket-1',
        order: 0,
        startAge: 35,
        endAge: 65,
        assumptions: {
          annualIncome: 100000,
          annualSpending: 60000,
          contributions: {
            '401k': 20000,
          },
        },
      },
      {
        id: 'bucket-2',
        order: 1,
        startAge: 66,
        endAge: 999,
        assumptions: {
          annualIncome: 0, // Retired
          annualSpending: 50000,
        },
      },
    ],
    lumpSumEvents: [],
    mortgages: [],
    ...overrides,
  });

  describe('calculateAge', () => {
    it('should calculate age correctly', () => {
      const birthYear = new Date().getFullYear() - 35;
      const age = calculateAge(`${birthYear}-01-01`);
      expect(age).toBe(35);
    });

    it('should handle birth month/day correctly', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 35;
      const futureMonth = today.getMonth() + 2;
      const age = calculateAge(`${birthYear}-${futureMonth.toString().padStart(2, '0')}-01`);
      expect(age).toBe(34); // Haven't hit birthday yet
    });
  });

  describe('Income vs Withdrawals Separation', () => {
    it('should separate reported income from withdrawals', () => {
      const profile = createTestProfile(35);
      const accounts = createTestAccounts();
      const scenario = createTestScenario();
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 2
      );

      const firstYear = projection.years[0];

      // Year 1: Should have income but no withdrawals (income > spending + contributions)
      expect(firstYear.income.reported).toBeGreaterThan(0);
      expect(firstYear.income.reported).toBe(
        firstYear.income.employment +
        firstYear.income.socialSecurity +
        firstYear.income.lumpSum
      );
      expect(firstYear.income.withdrawals).toBe(0); // No deficit, no withdrawals needed
      expect(firstYear.income.total).toBe(firstYear.income.reported + firstYear.income.withdrawals);
    });

    it('should track withdrawals when spending exceeds income', () => {
      const profile = createTestProfile(67); // Retired
      const accounts = createTestAccounts();
      const scenario = createTestScenario({
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 67,
            endAge: 999,
            assumptions: {
              annualIncome: 0, // No employment income
              annualSpending: 50000, // Spending exceeds SS income
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // Should have SS income but need withdrawals to cover spending
      expect(firstYear.income.reported).toBeGreaterThan(0); // Social Security
      expect(firstYear.income.withdrawals).toBeGreaterThan(0); // Need to withdraw
      expect(firstYear.income.total).toBe(
        firstYear.income.reported + firstYear.income.withdrawals
      );

      // Gross income should equal spending (balanced budget)
      expect(Math.abs(firstYear.income.total - firstYear.spending.total)).toBeLessThan(1);
    });
  });

  describe('Inflation Calculations', () => {
    it('should apply inflation correctly year over year', () => {
      const profile = createTestProfile(35);
      const accounts = createTestAccounts();
      const scenario = createTestScenario({
        inflationRate: 3, // 3% inflation
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 10
      );

      // Check that spending increases with inflation
      const year1Spending = projection.years[0].spending.living;
      const year10Spending = projection.years[9].spending.living;

      // After 10 years at 3% inflation: 1.03^10 = 1.344
      const expectedIncrease = Math.pow(1.03, 9); // 9 years of growth
      const actualIncrease = year10Spending / year1Spending;

      expect(actualIncrease).toBeCloseTo(expectedIncrease, 2);
    });

    it('should apply 2% income inflation separately', () => {
      const profile = createTestProfile(35);
      const accounts = createTestAccounts();
      const scenario = createTestScenario({
        inflationRate: 3, // 3% general inflation
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 35,
            endAge: 999,
            assumptions: {
              annualIncome: 100000,
              annualSpending: 50000,
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 10
      );

      // Check that employment income increases at 2%
      const year1Income = projection.years[0].income.employment;
      const year10Income = projection.years[9].income.employment;

      // After 10 years at 2% income inflation: 1.02^10 = 1.219
      const expectedIncrease = Math.pow(1.02, 9); // 9 years of growth
      const actualIncrease = year10Income / year1Income;

      expect(actualIncrease).toBeCloseTo(expectedIncrease, 2);
    });
  });

  describe('Investment Returns', () => {
    it('should apply investment returns to retirement accounts', () => {
      const profile = createTestProfile(35);
      const accounts = [
        {
          id: '401k-1',
          userId: 'test-user-123',
          accountType: '401k' as const,
          accountName: '401k',
          balance: 100000,
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
      ];
      const scenario = createTestScenario({
        investmentReturnRate: 7, // 7% return
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 35,
            endAge: 999,
            assumptions: {
              annualIncome: 100000,
              annualSpending: 50000,
              contributions: {}, // No contributions to isolate returns
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // Should have investment gains
      expect(firstYear.income.investmentGains).toBeGreaterThan(0);
      // Gains should be approximately 7% of starting balance
      expect(firstYear.income.investmentGains).toBeCloseTo(100000 * 0.07, -2);
    });

    it('should NOT apply investment returns to cash accounts', () => {
      const profile = createTestProfile(35);
      const accounts = [
        {
          id: 'checking-1',
          userId: 'test-user-123',
          accountType: 'checking' as const,
          accountName: 'Checking',
          balance: 100000,
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
      ];
      const scenario = createTestScenario({
        investmentReturnRate: 7,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 35,
            endAge: 999,
            assumptions: {
              annualIncome: 100000,
              annualSpending: 50000,
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // Cash accounts should have zero investment gains
      expect(firstYear.income.investmentGains).toBe(0);
    });
  });

  describe('Account Withdrawal Logic', () => {
    it('should withdraw from checking first', () => {
      const profile = createTestProfile(67);
      const accounts = [
        {
          id: 'checking-1',
          userId: 'test-user-123',
          accountType: 'checking' as const,
          accountName: 'Checking',
          balance: 10000,
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
        {
          id: 'savings-1',
          userId: 'test-user-123',
          accountType: 'savings' as const,
          accountName: 'Savings',
          balance: 20000,
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
      ];
      const scenario = createTestScenario({
        socialSecurityIncome: 20000,
        inflationRate: 0, // Disable to simplify math
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 67,
            endAge: 999,
            assumptions: {
              annualIncome: 0,
              annualSpending: 30000, // Need to withdraw $10k
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // Should have withdrawn $10k from checking
      expect(firstYear.income.withdrawals).toBeCloseTo(10000, 0);
      expect(firstYear.accountBalances.byAccountType.checking).toBeCloseTo(0, 0);
      expect(firstYear.accountBalances.byAccountType.savings).toBeCloseTo(20000, 0);
    });

    it('should withdraw from multiple accounts in correct order', () => {
      const profile = createTestProfile(67);
      const accounts = [
        {
          id: 'checking-1',
          userId: 'test-user-123',
          accountType: 'checking' as const,
          accountName: 'Checking',
          balance: 5000,
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
        {
          id: 'savings-1',
          userId: 'test-user-123',
          accountType: 'savings' as const,
          accountName: 'Savings',
          balance: 5000,
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
        {
          id: 'brokerage-1',
          userId: 'test-user-123',
          accountType: 'brokerage' as const,
          accountName: 'Brokerage',
          balance: 10000,
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
      ];
      const scenario = createTestScenario({
        socialSecurityIncome: 20000,
        investmentReturnRate: 0, // Disable returns to simplify math
        inflationRate: 0, // Disable inflation to simplify math
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 67,
            endAge: 999,
            assumptions: {
              annualIncome: 0,
              annualSpending: 35000, // Need to withdraw $15k
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // Should have withdrawn $15k total
      expect(firstYear.income.withdrawals).toBeCloseTo(15000, 0);
      // Checking should be empty (withdrew $5k)
      expect(firstYear.accountBalances.byAccountType.checking).toBeCloseTo(0, 0);
      // Savings should be empty (withdrew $5k)
      expect(firstYear.accountBalances.byAccountType.savings).toBeCloseTo(0, 0);
      // Brokerage should have $5k left (withdrew $5k)
      expect(firstYear.accountBalances.byAccountType.brokerage).toBeCloseTo(5000, 0);
    });
  });

  describe('Required Minimum Distributions (RMDs)', () => {
    it('should calculate RMDs starting at age 73', () => {
      const profile = createTestProfile(73);
      const accounts = [
        {
          id: '401k-1',
          userId: 'test-user-123',
          accountType: '401k' as const,
          accountName: '401k',
          balance: 265000, // Will trigger ~$10k RMD
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
      ];
      const scenario = createTestScenario({
        investmentReturnRate: 0, // Disable to simplify
        socialSecurityIncome: 30000,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 73,
            endAge: 999,
            assumptions: {
              annualIncome: 0,
              annualSpending: 30000,
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // At age 73, life expectancy factor is 26.5
      // RMD = 265000 / 26.5 = $10,000
      const expectedRMD = 265000 / 26.5;

      // Account should be reduced by RMD
      const accountReduction = 265000 - firstYear.accountBalances.byAccountType['401k'];
      expect(accountReduction).toBeCloseTo(expectedRMD, 0);
    });

    it('should not calculate RMDs before age 73', () => {
      const profile = createTestProfile(72);
      const accounts = [
        {
          id: '401k-1',
          userId: 'test-user-123',
          accountType: '401k' as const,
          accountName: '401k',
          balance: 265000,
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
      ];
      const scenario = createTestScenario({
        investmentReturnRate: 0,
        socialSecurityIncome: 30000,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 72,
            endAge: 999,
            assumptions: {
              annualIncome: 0,
              annualSpending: 30000,
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // Account balance should be unchanged (no RMD)
      expect(firstYear.accountBalances.byAccountType['401k']).toBeCloseTo(265000, 0);
    });
  });

  describe('Contributions', () => {
    it('should add contributions to correct account types', () => {
      const profile = createTestProfile(35);
      const accounts = [
        {
          id: '401k-1',
          userId: 'test-user-123',
          accountType: '401k' as const,
          accountName: '401k',
          balance: 100000,
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
      ];
      const scenario = createTestScenario({
        investmentReturnRate: 0, // Disable to simplify
        inflationRate: 0, // Disable to simplify
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 35,
            endAge: 999,
            assumptions: {
              annualIncome: 100000,
              annualSpending: 50000,
              contributions: {
                '401k': 20000,
              },
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // 401k should have starting balance + contribution
      expect(firstYear.accountBalances.byAccountType['401k']).toBeCloseTo(120000, 0);
      expect(firstYear.contributions.byAccountType['401k']).toBeCloseTo(20000, 0);
    });

    it('should apply inflation to contributions', () => {
      const profile = createTestProfile(35);
      const accounts = createTestAccounts();
      const scenario = createTestScenario({
        inflationRate: 3,
        investmentReturnRate: 0,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 35,
            endAge: 999,
            assumptions: {
              annualIncome: 100000,
              annualSpending: 40000,
              contributions: {
                '401k': 20000,
              },
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 10
      );

      // Contributions should increase with inflation
      const year1Contribution = projection.years[0].contributions.byAccountType['401k'];
      const year10Contribution = projection.years[9].contributions.byAccountType['401k'];

      // After 10 years at 3% inflation: 1.03^10 = 1.344
      const expectedIncrease = Math.pow(1.03, 9);
      const actualIncrease = year10Contribution / year1Contribution;

      expect(actualIncrease).toBeCloseTo(expectedIncrease, 2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero income scenario', () => {
      const profile = createTestProfile(67);
      const accounts = createTestAccounts();
      const scenario = createTestScenario({
        socialSecurityIncome: 0,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 67,
            endAge: 999,
            assumptions: {
              annualIncome: 0,
              annualSpending: 50000,
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // All income should come from withdrawals
      expect(firstYear.income.reported).toBe(0);
      expect(firstYear.income.withdrawals).toBeGreaterThan(0);
      expect(firstYear.income.total).toBe(firstYear.income.withdrawals);
    });

    it('should handle account depletion gracefully', () => {
      const profile = createTestProfile(67);
      const accounts = [
        {
          id: 'checking-1',
          userId: 'test-user-123',
          accountType: 'checking' as const,
          accountName: 'Checking',
          balance: 1000,
          asOfDate: '2025-01-01',
          status: 'active' as const,
        },
      ];
      const scenario = createTestScenario({
        socialSecurityIncome: 10000,
        investmentReturnRate: 0,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            order: 0,
            startAge: 67,
            endAge: 999,
            assumptions: {
              annualIncome: 0,
              annualSpending: 50000,
            },
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // Should show deficit in checking (negative balance)
      expect(firstYear.accountBalances.byAccountType.checking).toBeLessThan(0);
      // Still tracks the withdrawal amount needed
      expect(firstYear.income.withdrawals).toBeGreaterThan(40000);
    });

    it('should handle lump sum events correctly', () => {
      const profile = createTestProfile(35);
      const accounts = createTestAccounts();
      const scenario = createTestScenario({
        lumpSumEvents: [
          {
            id: 'lump-1',
            type: 'income',
            age: 35,
            amount: 50000,
            description: 'Bonus',
          },
          {
            id: 'lump-2',
            type: 'expense',
            age: 35,
            amount: 20000,
            description: 'Car Purchase',
          },
        ],
      });
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 1
      );

      const firstYear = projection.years[0];

      // Lump sum income should be included in reported income
      expect(firstYear.income.lumpSum).toBe(50000);
      expect(firstYear.spending.lumpSum).toBe(20000);
    });
  });

  describe('Projection Summary', () => {
    it('should calculate summary correctly', () => {
      const profile = createTestProfile(35);
      const accounts = createTestAccounts();
      const scenario = createTestScenario();
      const currentYear = new Date().getFullYear();

      const projection = calculateScenarioProjection(
        scenario,
        profile,
        accounts,
        currentYear,
        currentYear + 5
      );

      // Summary should aggregate all years
      const totalIncome = projection.years.reduce((sum, y) => sum + y.income.total, 0);
      const totalSpending = projection.years.reduce((sum, y) => sum + y.spending.total, 0);
      const totalContributions = projection.years.reduce((sum, y) => sum + y.contributions.total, 0);

      expect(projection.summary.totalIncome).toBeCloseTo(totalIncome, 0);
      expect(projection.summary.totalSpending).toBeCloseTo(totalSpending, 0);
      expect(projection.summary.totalContributions).toBeCloseTo(totalContributions, 0);
    });
  });
});
