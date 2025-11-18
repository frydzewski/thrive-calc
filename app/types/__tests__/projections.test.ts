/**
 * Tests for projection calculations
 *
 * This file tests the core retirement projection engine that models year-by-year
 * financial scenarios including income, spending, investment returns, and account balances.
 */

import {
  calculateAge,
  calculateScenarioProjection,
  calculateProjectionSummary,
  AnnualProjection,
} from '../projections';
import { Scenario } from '../scenarios';
import { UserProfile } from '../profile';
import { Account } from '../accounts';

describe('Projection Calculations', () => {
  // Test data fixtures
  const sampleProfile: UserProfile = {
    username: 'test@example.com',
    firstname: 'Test',
    dateOfBirth: '1985-06-15',
    maritalStatus: 'single',
    numberOfDependents: 0,
    onboardingComplete: true,
  };

  const sampleAccounts: Account[] = [
    {
      id: 'acc-1',
      username: 'test@example.com',
      accountType: '401k',
      accountName: '401k - Employer',
      institution: 'Vanguard',
      balance: 100000,
      asOfDate: '2024-01-01',
      status: 'active',
    },
    {
      id: 'acc-2',
      username: 'test@example.com',
      accountType: 'roth-ira',
      accountName: 'Roth IRA',
      institution: 'Fidelity',
      balance: 50000,
      asOfDate: '2024-01-01',
      status: 'active',
    },
    {
      id: 'acc-3',
      username: 'test@example.com',
      accountType: 'savings',
      accountName: 'Emergency Fund',
      institution: 'Chase',
      balance: 30000,
      asOfDate: '2024-01-01',
      status: 'active',
    },
    {
      id: 'acc-4',
      username: 'test@example.com',
      accountType: 'checking',
      accountName: 'Checking',
      institution: 'Chase',
      balance: 10000,
      asOfDate: '2024-01-01',
      status: 'active',
    },
  ];

  const sampleScenario: Scenario = {
    id: 'scenario-1',
    username: 'test@example.com',
    name: 'Base Case',
    isDefault: true,
    retirementAge: 65,
    socialSecurityAge: 67,
    socialSecurityIncome: 30000,
    investmentReturnRate: 7,
    inflationRate: 2.5,
    assumptionBuckets: [
      {
        id: 'bucket-1',
        name: 'Working Years',
        startAge: 30,
        endAge: 64,
        assumptions: {
          annualIncome: 100000,
          annualSpending: 60000,
          annualTravelBudget: 10000,
          annualHealthcareCosts: 5000,
          contributions: {
            '401k': 20000,
            'traditional-ira': 0,
            'roth-ira': 6500,
            'brokerage': 5000,
            'savings': 0,
            'checking': 0,
          },
        },
      },
      {
        id: 'bucket-2',
        name: 'Retirement',
        startAge: 65,
        endAge: 95,
        assumptions: {
          annualIncome: 0,
          annualSpending: 50000,
          annualTravelBudget: 15000,
          annualHealthcareCosts: 10000,
          contributions: {
            '401k': 0,
            'traditional-ira': 0,
            'roth-ira': 0,
            'brokerage': 0,
            'savings': 0,
            'checking': 0,
          },
        },
      },
    ],
    lumpSumEvents: [],
    mortgages: [],
  };

  describe('calculateAge', () => {
    it('should calculate correct age for someone born in June', () => {
      // Mock current date to be January 2024
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15'));

      const age = calculateAge('1985-06-15');
      expect(age).toBe(38); // Birthday hasn't happened yet in January

      jest.useRealTimers();
    });

    it('should calculate correct age after birthday', () => {
      // Mock current date to be July 2024 (after June 15 birthday)
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-07-15'));

      const age = calculateAge('1985-06-15');
      expect(age).toBe(39); // Birthday already happened

      jest.useRealTimers();
    });

    it('should handle leap year birthdays', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-01'));

      const age = calculateAge('2000-02-29');
      expect(age).toBe(24);

      jest.useRealTimers();
    });
  });

  describe('calculateScenarioProjection', () => {
    beforeEach(() => {
      // Mock current date to be January 2024 for consistent testing
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throw error if scenario has no assumption buckets', () => {
      const invalidScenario: Scenario = {
        ...sampleScenario,
        assumptionBuckets: [],
      };

      expect(() =>
        calculateScenarioProjection(invalidScenario, sampleProfile, sampleAccounts, 2024, 2030)
      ).toThrow('Scenario must have at least one assumption bucket');
    });

    it('should throw error if start year is after end year', () => {
      expect(() =>
        calculateScenarioProjection(sampleScenario, sampleProfile, sampleAccounts, 2030, 2024)
      ).toThrow('Start year must be less than or equal to end year');
    });

    it('should throw error if projection period exceeds 100 years', () => {
      expect(() =>
        calculateScenarioProjection(sampleScenario, sampleProfile, sampleAccounts, 2024, 2125)
      ).toThrow('Projection period cannot exceed 100 years');
    });

    it('should calculate basic projection for working years', () => {
      const projection = calculateScenarioProjection(
        sampleScenario,
        sampleProfile,
        sampleAccounts,
        2024,
        2026 // Just 3 years for simple test
      );

      expect(projection.scenarioId).toBe('scenario-1');
      expect(projection.scenarioName).toBe('Base Case');
      expect(projection.years.length).toBe(3);

      // Check first year (2024, age 38)
      const year1 = projection.years[0];
      expect(year1.year).toBe(2024);
      expect(year1.age).toBe(38);

      // Income should include employment income (inflated) and investment gains
      expect(year1.income.employment).toBeGreaterThan(100000); // Inflated from base
      expect(year1.income.socialSecurity).toBe(0); // Not old enough yet
      expect(year1.income.investmentGains).toBeGreaterThan(0); // 7% on starting balance

      // Spending should be inflated
      expect(year1.spending.living).toBeGreaterThan(60000);
      expect(year1.spending.travel).toBeGreaterThan(10000);
      expect(year1.spending.healthcare).toBeGreaterThan(5000);

      // Contributions should be inflated
      expect(year1.contributions.total).toBeGreaterThan(31500); // Sum of all contributions inflated

      // Account balances should increase
      expect(year1.accountBalances.total).toBeGreaterThan(190000); // Starting was 190k
    });

    it('should handle retirement transition correctly', () => {
      const projection = calculateScenarioProjection(
        sampleScenario,
        sampleProfile,
        sampleAccounts,
        2024,
        2062 // Goes through retirement at age 65
      );

      // Find year just before retirement (age 64, year 2050)
      const workingYear = projection.years.find((y) => y.age === 64);
      expect(workingYear).toBeDefined();
      expect(workingYear!.income.employment).toBeGreaterThan(0);

      // Find first retirement year (age 65, year 2051)
      const retirementYear = projection.years.find((y) => y.age === 65);
      expect(retirementYear).toBeDefined();
      expect(retirementYear!.income.employment).toBe(0); // No more employment income
      expect(retirementYear!.contributions.total).toBe(0); // No more contributions
    });

    it('should handle Social Security correctly', () => {
      const projection = calculateScenarioProjection(
        sampleScenario,
        sampleProfile,
        sampleAccounts,
        2024,
        2062 // Includes Social Security age 67
      );

      // Year before Social Security (age 66, year 2052)
      const beforeSS = projection.years.find((y) => y.age === 66);
      expect(beforeSS).toBeDefined();
      expect(beforeSS!.income.socialSecurity).toBe(0);

      // First Social Security year (age 67, year 2053)
      const firstSS = projection.years.find((y) => y.age === 67);
      expect(firstSS).toBeDefined();
      expect(firstSS!.income.socialSecurity).toBeGreaterThan(30000); // Inflated
    });

    it('should handle lump sum events correctly', () => {
      const scenarioWithLumpSum: Scenario = {
        ...sampleScenario,
        lumpSumEvents: [
          {
            id: 'event-1',
            name: 'Home Sale',
            type: 'income',
            age: 40,
            amount: 200000,
          },
          {
            id: 'event-2',
            name: 'Car Purchase',
            type: 'expense',
            age: 42,
            amount: 50000,
          },
        ],
      };

      const projection = calculateScenarioProjection(
        scenarioWithLumpSum,
        sampleProfile,
        sampleAccounts,
        2024,
        2030
      );

      // Year with lump sum income (age 40, year 2026)
      const incomeYear = projection.years.find((y) => y.age === 40);
      expect(incomeYear).toBeDefined();
      expect(incomeYear!.income.lumpSum).toBe(200000); // NOT inflated

      // Year with lump sum expense (age 42, year 2028)
      const expenseYear = projection.years.find((y) => y.age === 42);
      expect(expenseYear).toBeDefined();
      expect(expenseYear!.spending.lumpSum).toBe(50000); // NOT inflated
    });

    it('should aggregate accounts by type correctly', () => {
      const projection = calculateScenarioProjection(
        sampleScenario,
        sampleProfile,
        sampleAccounts,
        2024,
        2025
      );

      const year1 = projection.years[0];

      // Starting balances
      expect(year1.accountBalances.byAccountType['401k']).toBeGreaterThan(100000);
      expect(year1.accountBalances.byAccountType['roth-ira']).toBeGreaterThan(50000);
      expect(year1.accountBalances.byAccountType['savings']).toBeGreaterThan(0);
      expect(year1.accountBalances.byAccountType['checking']).toBeGreaterThan(0);

      // Total should equal sum of all types
      const sum = Object.values(year1.accountBalances.byAccountType).reduce(
        (a, b) => a + b,
        0
      );
      expect(year1.accountBalances.total).toBeCloseTo(sum, 2);
    });

    it('should handle deficit years by withdrawing from cash accounts', () => {
      // Create scenario with high spending and low income in retirement
      const deficitScenario: Scenario = {
        ...sampleScenario,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            name: 'Retirement with High Spending',
            startAge: 30,
            endAge: 95,
            assumptions: {
              annualIncome: 0, // No income
              annualSpending: 100000, // High spending
              annualTravelBudget: 20000,
              annualHealthcareCosts: 10000,
              contributions: {
                '401k': 0,
                'traditional-ira': 0,
                'roth-ira': 0,
                'brokerage': 0,
                'savings': 0,
                'checking': 0,
              },
            },
          },
        ],
      };

      const projection = calculateScenarioProjection(
        deficitScenario,
        sampleProfile,
        sampleAccounts,
        2024,
        2026
      );

      // Should have negative net income
      expect(projection.years[0].netIncome).toBeLessThan(0);

      // Cash accounts should decrease
      const year1Checking = projection.years[0].accountBalances.byAccountType['checking'];
      const year2Checking = projection.years[1].accountBalances.byAccountType['checking'];
      expect(year2Checking).toBeLessThan(year1Checking);
    });

    it('should apply inflation correctly across years', () => {
      const projection = calculateScenarioProjection(
        sampleScenario,
        sampleProfile,
        sampleAccounts,
        2024,
        2027
      );

      // Employment income should increase each year at 2% (hard-coded income inflation)
      const year1Income = projection.years[0].income.employment;
      const year2Income = projection.years[1].income.employment;
      const year3Income = projection.years[2].income.employment;

      expect(year2Income).toBeGreaterThan(year1Income);
      expect(year3Income).toBeGreaterThan(year2Income);

      // Income inflates at 2% annually (separate from scenario inflation rate)
      const expectedFactor2 = Math.pow(1.02, 2);
      expect(year2Income / year1Income).toBeCloseTo(1.02, 2);
      expect(year3Income / year1Income).toBeCloseTo(expectedFactor2, 2);
    });

    it('should apply investment returns each year', () => {
      const projection = calculateScenarioProjection(
        sampleScenario,
        sampleProfile,
        sampleAccounts,
        2024,
        2026
      );

      // Each year should have investment gains
      projection.years.forEach((year) => {
        expect(year.income.investmentGains).toBeGreaterThan(0);
      });

      // Gains should increase as balances grow
      const year1Gains = projection.years[0].income.investmentGains;
      const year2Gains = projection.years[1].income.investmentGains;
      expect(year2Gains).toBeGreaterThan(year1Gains);
    });

    it('should handle inactive accounts correctly', () => {
      const accountsWithInactive: Account[] = [
        ...sampleAccounts,
        {
          id: 'acc-5',
          username: 'test@example.com',
          accountType: '401k',
          accountName: 'Old 401k',
          institution: 'Former Employer',
          balance: 50000,
          asOfDate: '2020-01-01',
          status: 'inactive', // Inactive should not be included
        },
      ];

      const projection = calculateScenarioProjection(
        sampleScenario,
        sampleProfile,
        accountsWithInactive,
        2024,
        2025
      );

      // Starting total should be 190k (not 240k which would include inactive)
      const year1Total = projection.years[0].accountBalances.total;
      expect(year1Total).toBeGreaterThan(190000);
      expect(year1Total).toBeLessThan(250000);
    });

    it('should include mortgage payments in spending', () => {
      const scenarioWithMortgage: Scenario = {
        ...sampleScenario,
        mortgages: [
          {
            id: 'mort-1',
            name: 'Primary Home',
            startDate: '2024-01-01',
            loanAmount: 400000,
            termYears: 30,
            interestRate: 6.5,
            monthlyEscrow: 500,
            additionalMonthlyPayment: 0,
          },
        ],
      };

      const projection = calculateScenarioProjection(
        scenarioWithMortgage,
        sampleProfile,
        sampleAccounts,
        2024,
        2026
      );

      // Should have mortgage payments
      const year1 = projection.years[0];
      expect(year1.spending.mortgages).toBeGreaterThan(0);
      expect(year1.mortgagePayments.total).toBeGreaterThan(0);
      expect(year1.mortgagePayments.principal).toBeGreaterThan(0);
      expect(year1.mortgagePayments.interest).toBeGreaterThan(0);
      expect(year1.mortgagePayments.escrow).toBeGreaterThan(0);

      // Mortgage payments should be included in total spending
      expect(year1.spending.total).toBeGreaterThan(
        year1.spending.living + year1.spending.travel + year1.spending.healthcare
      );
    });

    it('should handle contribution allocation across account types', () => {
      const projection = calculateScenarioProjection(
        sampleScenario,
        sampleProfile,
        sampleAccounts,
        2024,
        2025
      );

      const year1 = projection.years[0];

      // Should have contributions to specific account types
      expect(year1.contributions.byAccountType['401k']).toBeGreaterThan(0);
      expect(year1.contributions.byAccountType['roth-ira']).toBeGreaterThan(0);
      expect(year1.contributions.byAccountType['brokerage']).toBeGreaterThan(0);

      // Total should match sum
      const sum = Object.values(year1.contributions.byAccountType).reduce(
        (a, b) => a + b,
        0
      );
      expect(year1.contributions.total).toBeCloseTo(sum, 2);
    });
  });

  describe('calculateProjectionSummary', () => {
    const sampleYears: AnnualProjection[] = [
      {
        year: 2024,
        age: 38,
        income: {
          employment: 100000,
          socialSecurity: 0,
          lumpSum: 0,
          investmentGains: 10000,
          total: 110000,
        },
        spending: {
          living: 60000,
          travel: 10000,
          healthcare: 5000,
          lumpSum: 0,
          mortgages: 0,
          total: 75000,
        },
        mortgagePayments: {
          principal: 0,
          interest: 0,
          escrow: 0,
          additionalPrincipal: 0,
          total: 0,
          byMortgage: [],
        },
        contributions: {
          total: 31500,
          byAccountType: {
            '401k': 20000,
            'traditional-ira': 0,
            'roth-ira': 6500,
            'brokerage': 5000,
            'savings': 0,
            'checking': 0,
          },
        },
        netIncome: 3500,
        accountBalances: {
          total: 200000,
          byAccountType: {
            '401k': 100000,
            'traditional-ira': 0,
            'roth-ira': 50000,
            'brokerage': 0,
            'savings': 30000,
            'checking': 20000,
          },
        },
      },
      {
        year: 2025,
        age: 39,
        income: {
          employment: 102500,
          socialSecurity: 0,
          lumpSum: 0,
          investmentGains: 12000,
          total: 114500,
        },
        spending: {
          living: 61500,
          travel: 10250,
          healthcare: 5125,
          lumpSum: 0,
          mortgages: 0,
          total: 76875,
        },
        mortgagePayments: {
          principal: 0,
          interest: 0,
          escrow: 0,
          additionalPrincipal: 0,
          total: 0,
          byMortgage: [],
        },
        contributions: {
          total: 32288,
          byAccountType: {
            '401k': 20500,
            'traditional-ira': 0,
            'roth-ira': 6663,
            'brokerage': 5125,
            'savings': 0,
            'checking': 0,
          },
        },
        netIncome: 5337,
        accountBalances: {
          total: 220000,
          byAccountType: {
            '401k': 110000,
            'traditional-ira': 0,
            'roth-ira': 55000,
            'brokerage': 0,
            'savings': 30000,
            'checking': 25000,
          },
        },
      },
      {
        year: 2026,
        age: 40,
        income: {
          employment: 0, // Retired
          socialSecurity: 0,
          lumpSum: 0,
          investmentGains: 14000,
          total: 14000,
        },
        spending: {
          living: 63075,
          travel: 10506,
          healthcare: 5253,
          lumpSum: 0,
          mortgages: 0,
          total: 78834,
        },
        mortgagePayments: {
          principal: 0,
          interest: 0,
          escrow: 0,
          additionalPrincipal: 0,
          total: 0,
          byMortgage: [],
        },
        contributions: {
          total: 0,
          byAccountType: {
            '401k': 0,
            'traditional-ira': 0,
            'roth-ira': 0,
            'brokerage': 0,
            'savings': 0,
            'checking': 0,
          },
        },
        netIncome: -64834, // Deficit year
        accountBalances: {
          total: 180000,
          byAccountType: {
            '401k': 110000,
            'traditional-ira': 0,
            'roth-ira': 55000,
            'brokerage': 0,
            'savings': 10000,
            'checking': 5000,
          },
        },
      },
    ];

    it('should calculate correct totals', () => {
      const summary = calculateProjectionSummary(sampleYears, 2024, 2026);

      expect(summary.startYear).toBe(2024);
      expect(summary.endYear).toBe(2026);
      expect(summary.totalIncome).toBe(238500); // Sum of all income.total
      expect(summary.totalSpending).toBe(230709); // Sum of all spending.total
      expect(summary.totalContributions).toBe(63788); // Sum of all contributions.total
    });

    it('should calculate final net worth correctly', () => {
      const summary = calculateProjectionSummary(sampleYears, 2024, 2026);

      expect(summary.finalNetWorth).toBe(180000); // Last year's total balance
    });

    it('should identify deficit years correctly', () => {
      const summary = calculateProjectionSummary(sampleYears, 2024, 2026);

      expect(summary.yearsInDeficit).toBe(1); // Only 2026 has negative net income
      expect(summary.firstDeficitYear).toBe(2026);
    });

    it('should handle no deficit years', () => {
      const noDeficitYears = sampleYears.slice(0, 2); // Only years with positive net income

      const summary = calculateProjectionSummary(noDeficitYears, 2024, 2025);

      expect(summary.yearsInDeficit).toBe(0);
      expect(summary.firstDeficitYear).toBeUndefined();
    });

    it('should handle empty years array', () => {
      const summary = calculateProjectionSummary([], 2024, 2026);

      expect(summary.totalIncome).toBe(0);
      expect(summary.totalSpending).toBe(0);
      expect(summary.totalContributions).toBe(0);
      expect(summary.finalNetWorth).toBe(0);
      expect(summary.yearsInDeficit).toBe(0);
      expect(summary.firstDeficitYear).toBeUndefined();
    });
  });

  describe('Cash Flow Withdrawal Priority', () => {
    it('should withdraw from checking first when in deficit', () => {
      const accountsWithChecking: Account[] = [
        {
          id: 'acc-checking',
          username: 'test@example.com',
          accountType: 'checking',
          accountName: 'Checking',
          institution: 'Bank',
          balance: 50000,
          asOfDate: '2024-01-01',
          status: 'active',
        },
        {
          id: 'acc-savings',
          username: 'test@example.com',
          accountType: 'savings',
          accountName: 'Savings',
          institution: 'Bank',
          balance: 100000,
          asOfDate: '2024-01-01',
          status: 'active',
        },
      ];

      const deficitScenario: Scenario = {
        ...sampleScenario,
        investmentReturnRate: 0, // Disable returns to isolate cash flow logic
        assumptionBuckets: [
          {
            id: 'bucket-1',
            name: 'Deficit Test',
            startAge: 39, // Profile born 1985, so 39 in 2024
            endAge: 50,
            assumptions: {
              annualIncome: 0,
              annualSpending: 30000, // Will cause $30k deficit
              annualTravelBudget: 0,
              annualHealthcareCosts: 0,
              contributions: {
                '401k': 0,
                'traditional-ira': 0,
                'roth-ira': 0,
                'brokerage': 0,
                'savings': 0,
                'checking': 0,
              },
            },
          },
        ],
      };

      const projection = calculateScenarioProjection(
        deficitScenario,
        sampleProfile,
        accountsWithChecking,
        2024,
        2025
      );

      // Checking should be depleted first
      const year1Checking = projection.years[0].accountBalances.byAccountType['checking'];
      const year1Savings = projection.years[0].accountBalances.byAccountType['savings'];

      expect(year1Checking).toBeLessThan(50000); // Checking decreased
      expect(year1Savings).toBe(100000); // Savings unchanged (checking depleted first)
    });

    it('should cascade through withdrawal hierarchy: checking -> savings -> brokerage -> retirement', () => {
      const multiAccountSetup: Account[] = [
        {
          id: 'acc-checking',
          username: 'test@example.com',
          accountType: 'checking',
          accountName: 'Checking',
          institution: 'Bank',
          balance: 10000, // Small balance, will be depleted
          asOfDate: '2024-01-01',
          status: 'active',
        },
        {
          id: 'acc-savings',
          username: 'test@example.com',
          accountType: 'savings',
          accountName: 'Savings',
          institution: 'Bank',
          balance: 20000, // Will be tapped after checking
          asOfDate: '2024-01-01',
          status: 'active',
        },
        {
          id: 'acc-brokerage',
          username: 'test@example.com',
          accountType: 'brokerage',
          accountName: 'Brokerage',
          institution: 'Vanguard',
          balance: 50000,
          asOfDate: '2024-01-01',
          status: 'active',
        },
        {
          id: 'acc-401k',
          username: 'test@example.com',
          accountType: '401k',
          accountName: '401k',
          institution: 'Employer',
          balance: 100000,
          asOfDate: '2024-01-01',
          status: 'active',
        },
      ];

      const largeDeficitScenario: Scenario = {
        ...sampleScenario,
        investmentReturnRate: 0, // Disable returns to isolate cash flow logic
        assumptionBuckets: [
          {
            id: 'bucket-1',
            name: 'Large Deficit',
            startAge: 39, // Profile born 1985, so 39 in 2024
            endAge: 50,
            assumptions: {
              annualIncome: 0,
              annualSpending: 40000, // $40k deficit
              annualTravelBudget: 0,
              annualHealthcareCosts: 0,
              contributions: {
                '401k': 0,
                'traditional-ira': 0,
                'roth-ira': 0,
                'brokerage': 0,
                'savings': 0,
                'checking': 0,
              },
            },
          },
        ],
      };

      const projection = calculateScenarioProjection(
        largeDeficitScenario,
        sampleProfile,
        multiAccountSetup,
        2024,
        2025
      );

      const balances = projection.years[0].accountBalances.byAccountType;

      // Checking should be fully depleted or very low
      expect(balances['checking']).toBeLessThan(1000);

      // Savings should be depleted (tapped after checking)
      expect(balances['savings']).toBeLessThan(20000);

      // Brokerage should have been tapped
      expect(balances['brokerage']).toBeLessThan(50000);

      // 401k should have minimal depletion (only if needed)
      expect(balances['401k']).toBeLessThanOrEqual(100000);
    });

    it('should only tap retirement accounts as last resort', () => {
      const retirementLastResort: Account[] = [
        {
          id: 'acc-checking',
          username: 'test@example.com',
          accountType: 'checking',
          accountName: 'Checking',
          institution: 'Bank',
          balance: 5000,
          asOfDate: '2024-01-01',
          status: 'active',
        },
        {
          id: 'acc-traditional-ira',
          username: 'test@example.com',
          accountType: 'traditional-ira',
          accountName: 'Traditional IRA',
          institution: 'Fidelity',
          balance: 200000,
          asOfDate: '2024-01-01',
          status: 'active',
        },
        {
          id: 'acc-roth-ira',
          username: 'test@example.com',
          accountType: 'roth-ira',
          accountName: 'Roth IRA',
          institution: 'Vanguard',
          balance: 100000,
          asOfDate: '2024-01-01',
          status: 'active',
        },
      ];

      const retirementDeficitScenario: Scenario = {
        ...sampleScenario,
        investmentReturnRate: 0, // Disable returns to isolate cash flow logic
        assumptionBuckets: [
          {
            id: 'bucket-1',
            name: 'Retirement Deficit',
            startAge: 39, // Profile born 1985, so 39 in 2024
            endAge: 50,
            assumptions: {
              annualIncome: 0,
              annualSpending: 20000, // $20k deficit
              annualTravelBudget: 0,
              annualHealthcareCosts: 0,
              contributions: {
                '401k': 0,
                'traditional-ira': 0,
                'roth-ira': 0,
                'brokerage': 0,
                'savings': 0,
                'checking': 0,
              },
            },
          },
        ],
      };

      const projection = calculateScenarioProjection(
        retirementDeficitScenario,
        sampleProfile,
        retirementLastResort,
        2024,
        2025
      );

      const balances = projection.years[0].accountBalances.byAccountType;

      // Checking depleted or very low
      expect(balances['checking']).toBeLessThan(1000);

      // Traditional IRA tapped for deficit
      expect(balances['traditional-ira']).toBeLessThan(200000);

      // Roth IRA untouched or minimally touched (last resort)
      expect(balances['roth-ira']).toBeGreaterThanOrEqual(99000); // Allow for small withdrawals
    });
  });

  describe('Required Minimum Distribution (RMD) Calculations', () => {
    it('should not apply RMD before age 73', () => {
      // Profile born 1953, age 72 in 2025 (just before RMD)
      const age72Profile: UserProfile = {
        ...sampleProfile,
        dateOfBirth: '1953-01-01',
      };

      const retirementAccounts: Account[] = [
        {
          id: 'acc-traditional-ira',
          username: 'test@example.com',
          accountType: 'traditional-ira',
          accountName: 'Traditional IRA',
          institution: 'Vanguard',
          balance: 500000,
          asOfDate: '2025-01-01',
          status: 'active',
        },
        {
          id: 'acc-401k',
          username: 'test@example.com',
          accountType: '401k',
          accountName: '401k',
          institution: 'Fidelity',
          balance: 300000,
          asOfDate: '2025-01-01',
          status: 'active',
        },
      ];

      const preRmdScenario: Scenario = {
        ...sampleScenario,
        investmentReturnRate: 0, // Disable returns to isolate RMD logic
        socialSecurityAge: 100, // Disable social security for this test
        socialSecurityIncome: 0,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            name: 'Pre-RMD Year',
            startAge: 72, // Age 72 - just before RMD
            endAge: 72,
            assumptions: {
              annualIncome: 0,
              annualSpending: 0,
              annualTravelBudget: 0,
              annualHealthcareCosts: 0,
              contributions: {
                '401k': 0,
                'traditional-ira': 0,
                'roth-ira': 0,
                'brokerage': 0,
                'savings': 0,
                'checking': 0,
              },
            },
          },
        ],
      };

      // Run projection for single year at age 72 (before RMD)
      const projection = calculateScenarioProjection(
        preRmdScenario,
        age72Profile,
        retirementAccounts,
        2025,
        2025
      );

      // Verify no withdrawals from retirement accounts (no RMD at age 72)
      const year1 = projection.years[0];
      expect(year1.accountBalances.byAccountType['traditional-ira']).toBe(500000);
      expect(year1.accountBalances.byAccountType['401k']).toBe(300000);
      expect(year1.income.total).toBe(0); // No RMD income
    });

    it('should calculate correct RMD at age 73 using life expectancy factor 26.5', () => {
      // Profile needs to be born in 1952 to be age 73 in 2025
      const age73Profile: UserProfile = {
        ...sampleProfile,
        dateOfBirth: '1952-01-01',
      };

      const retirementAccounts: Account[] = [
        {
          id: 'acc-traditional-ira',
          username: 'test@example.com',
          accountType: 'traditional-ira',
          accountName: 'Traditional IRA',
          institution: 'Vanguard',
          balance: 500000,
          asOfDate: '2025-01-01',
          status: 'active',
        },
        {
          id: 'acc-401k',
          username: 'test@example.com',
          accountType: '401k',
          accountName: '401k',
          institution: 'Fidelity',
          balance: 300000,
          asOfDate: '2025-01-01',
          status: 'active',
        },
      ];

      const rmdScenario: Scenario = {
        ...sampleScenario,
        investmentReturnRate: 0,
        socialSecurityAge: 100, // Disable social security for this test
        socialSecurityIncome: 0,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            name: 'RMD Year',
            startAge: 73,
            endAge: 73,
            assumptions: {
              annualIncome: 0,
              annualSpending: 0,
              annualTravelBudget: 0,
              annualHealthcareCosts: 0,
              contributions: {
                '401k': 0,
                'traditional-ira': 0,
                'roth-ira': 0,
                'brokerage': 0,
                'savings': 0,
                'checking': 0,
              },
            },
          },
        ],
      };

      const projection = calculateScenarioProjection(
        rmdScenario,
        age73Profile,
        retirementAccounts,
        2025,
        2025
      );

      // Expected RMD = (500000 + 300000) / 26.5 = 30,188.68
      const expectedRmd = 800000 / 26.5;
      const year1 = projection.years[0];

      // Verify RMD amount is included in income
      expect(year1.income.total).toBeCloseTo(expectedRmd, 0);

      // Verify accounts were reduced by RMD (proportionally)
      const traditionalIraAfterRmd = 500000 - (expectedRmd * (500000 / 800000));
      const k401AfterRmd = 300000 - (expectedRmd * (300000 / 800000));

      expect(year1.accountBalances.byAccountType['traditional-ira']).toBeCloseTo(traditionalIraAfterRmd, 0);
      expect(year1.accountBalances.byAccountType['401k']).toBeCloseTo(k401AfterRmd, 0);
    });

    it('should use correct life expectancy factors at different ages', () => {
      // Test various ages with their corresponding life expectancy factors
      const testCases = [
        { age: 73, factor: 26.5, birthYear: 1952 },
        { age: 74, factor: 25.5, birthYear: 1951 },
        { age: 75, factor: 24.6, birthYear: 1950 },
        { age: 80, factor: 20.2, birthYear: 1945 },
        { age: 85, factor: 15.5, birthYear: 1940 },
        { age: 90, factor: 11.5, birthYear: 1935 },
        { age: 95, factor: 8.1, birthYear: 1930 },
        { age: 100, factor: 5.0, birthYear: 1925 },
      ];

      testCases.forEach(({ age, factor, birthYear }) => {
        const testProfile: UserProfile = {
          ...sampleProfile,
          dateOfBirth: `${birthYear}-01-01`,
        };

        const retirementAccounts: Account[] = [
          {
            id: 'acc-traditional-ira',
            username: 'test@example.com',
            accountType: 'traditional-ira',
            accountName: 'Traditional IRA',
            institution: 'Vanguard',
            balance: 1000000,
            asOfDate: '2025-01-01',
            status: 'active',
          },
        ];

        const rmdScenario: Scenario = {
          ...sampleScenario,
          investmentReturnRate: 0,
          socialSecurityAge: 100, // Disable social security for this test
          socialSecurityIncome: 0,
          assumptionBuckets: [
            {
              id: 'bucket-1',
              name: `RMD at Age ${age}`,
              startAge: age,
              endAge: age,
              assumptions: {
                annualIncome: 0,
                annualSpending: 0,
                annualTravelBudget: 0,
                annualHealthcareCosts: 0,
                contributions: {
                  '401k': 0,
                  'traditional-ira': 0,
                  'roth-ira': 0,
                  'brokerage': 0,
                  'savings': 0,
                  'checking': 0,
                },
              },
            },
          ],
        };

        const projection = calculateScenarioProjection(
          rmdScenario,
          testProfile,
          retirementAccounts,
          2025,
          2025
        );

        const expectedRmd = 1000000 / factor;
        const year1 = projection.years[0];

        expect(year1.income.total).toBeCloseTo(expectedRmd, 0);
        expect(year1.accountBalances.byAccountType['traditional-ira']).toBeCloseTo(1000000 - expectedRmd, 0);
      });
    });

    it('should withdraw RMD proportionally from traditional IRA and 401k', () => {
      const age73Profile: UserProfile = {
        ...sampleProfile,
        dateOfBirth: '1952-01-01',
      };

      const retirementAccounts: Account[] = [
        {
          id: 'acc-traditional-ira',
          username: 'test@example.com',
          accountType: 'traditional-ira',
          accountName: 'Traditional IRA',
          institution: 'Vanguard',
          balance: 600000, // 75% of total
          asOfDate: '2025-01-01',
          status: 'active',
        },
        {
          id: 'acc-401k',
          username: 'test@example.com',
          accountType: '401k',
          accountName: '401k',
          institution: 'Fidelity',
          balance: 200000, // 25% of total
          asOfDate: '2025-01-01',
          status: 'active',
        },
      ];

      const rmdScenario: Scenario = {
        ...sampleScenario,
        investmentReturnRate: 0,
        socialSecurityAge: 100, // Disable social security for this test
        socialSecurityIncome: 0,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            name: 'Proportional RMD',
            startAge: 73,
            endAge: 73,
            assumptions: {
              annualIncome: 0,
              annualSpending: 0,
              annualTravelBudget: 0,
              annualHealthcareCosts: 0,
              contributions: {
                '401k': 0,
                'traditional-ira': 0,
                'roth-ira': 0,
                'brokerage': 0,
                'savings': 0,
                'checking': 0,
              },
            },
          },
        ],
      };

      const projection = calculateScenarioProjection(
        rmdScenario,
        age73Profile,
        retirementAccounts,
        2025,
        2025
      );

      // Total RMD = 800000 / 26.5 = 30,188.68
      const totalRmd = 800000 / 26.5;
      const iraRmd = totalRmd * 0.75; // 75% from traditional IRA
      const k401Rmd = totalRmd * 0.25; // 25% from 401k

      const year1 = projection.years[0];

      // Verify proportional withdrawals
      expect(year1.accountBalances.byAccountType['traditional-ira']).toBeCloseTo(600000 - iraRmd, 0);
      expect(year1.accountBalances.byAccountType['401k']).toBeCloseTo(200000 - k401Rmd, 0);

      // Verify total RMD added to income
      expect(year1.income.total).toBeCloseTo(totalRmd, 0);
    });

    it('should not apply RMD to Roth IRA accounts', () => {
      const age73Profile: UserProfile = {
        ...sampleProfile,
        dateOfBirth: '1952-01-01',
      };

      const retirementAccounts: Account[] = [
        {
          id: 'acc-traditional-ira',
          username: 'test@example.com',
          accountType: 'traditional-ira',
          accountName: 'Traditional IRA',
          institution: 'Vanguard',
          balance: 500000,
          asOfDate: '2025-01-01',
          status: 'active',
        },
        {
          id: 'acc-roth-ira',
          username: 'test@example.com',
          accountType: 'roth-ira',
          accountName: 'Roth IRA',
          institution: 'Fidelity',
          balance: 300000,
          asOfDate: '2025-01-01',
          status: 'active',
        },
      ];

      const rmdScenario: Scenario = {
        ...sampleScenario,
        investmentReturnRate: 0,
        socialSecurityAge: 100, // Disable social security for this test
        socialSecurityIncome: 0,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            name: 'RMD Excludes Roth',
            startAge: 73,
            endAge: 73,
            assumptions: {
              annualIncome: 0,
              annualSpending: 0,
              annualTravelBudget: 0,
              annualHealthcareCosts: 0,
              contributions: {
                '401k': 0,
                'traditional-ira': 0,
                'roth-ira': 0,
                'brokerage': 0,
                'savings': 0,
                'checking': 0,
              },
            },
          },
        ],
      };

      const projection = calculateScenarioProjection(
        rmdScenario,
        age73Profile,
        retirementAccounts,
        2025,
        2025
      );

      // RMD should only be calculated on traditional IRA (500000 / 26.5)
      const expectedRmd = 500000 / 26.5;
      const year1 = projection.years[0];

      // Roth IRA should remain untouched
      expect(year1.accountBalances.byAccountType['roth-ira']).toBe(300000);

      // Traditional IRA should be reduced by RMD
      expect(year1.accountBalances.byAccountType['traditional-ira']).toBeCloseTo(500000 - expectedRmd, 0);

      // Income should only include RMD from traditional IRA
      expect(year1.income.total).toBeCloseTo(expectedRmd, 0);
    });

    it('should apply linear interpolation for ages between defined factors', () => {
      // Test age 76 (between 75 and 80)
      // Linear interpolation: 27.4 - (76 - 72) * 0.5 = 27.4 - 2.0 = 25.4
      const age76Profile: UserProfile = {
        ...sampleProfile,
        dateOfBirth: '1949-01-01',
      };

      const retirementAccounts: Account[] = [
        {
          id: 'acc-traditional-ira',
          username: 'test@example.com',
          accountType: 'traditional-ira',
          accountName: 'Traditional IRA',
          institution: 'Vanguard',
          balance: 1000000,
          asOfDate: '2025-01-01',
          status: 'active',
        },
      ];

      const rmdScenario: Scenario = {
        ...sampleScenario,
        investmentReturnRate: 0,
        socialSecurityAge: 100, // Disable social security for this test
        socialSecurityIncome: 0,
        assumptionBuckets: [
          {
            id: 'bucket-1',
            name: 'Interpolated RMD',
            startAge: 76,
            endAge: 76,
            assumptions: {
              annualIncome: 0,
              annualSpending: 0,
              annualTravelBudget: 0,
              annualHealthcareCosts: 0,
              contributions: {
                '401k': 0,
                'traditional-ira': 0,
                'roth-ira': 0,
                'brokerage': 0,
                'savings': 0,
                'checking': 0,
              },
            },
          },
        ],
      };

      const projection = calculateScenarioProjection(
        rmdScenario,
        age76Profile,
        retirementAccounts,
        2025,
        2025
      );

      // Expected factor: 27.4 - (76 - 72) * 0.5 = 25.4
      const expectedFactor = 27.4 - (76 - 72) * 0.5;
      const expectedRmd = 1000000 / expectedFactor;
      const year1 = projection.years[0];

      expect(year1.income.total).toBeCloseTo(expectedRmd, 0);
      expect(year1.accountBalances.byAccountType['traditional-ira']).toBeCloseTo(1000000 - expectedRmd, 0);
    });
  });
});
