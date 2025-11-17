import { AccountType, Account } from './accounts';
import { Scenario, AssumptionBucket, LumpSumEvent, getBucketForAge } from './scenarios';
import { UserProfile } from './profile';
import { getMortgagePaymentForYear, AnnualMortgagePayment } from './mortgages';

export interface AnnualProjection {
  year: number;
  age: number;

  // Income (inflated to year's dollars)
  income: {
    employment: number; // Inflated
    socialSecurity: number; // Inflated
    lumpSum: number; // NOT inflated (actual dollars)
    investmentGains: number;
    total: number;
  };

  // Spending (inflated to year's dollars)
  spending: {
    living: number; // Inflated
    travel: number; // Inflated
    healthcare: number; // Inflated
    lumpSum: number; // NOT inflated (actual dollars)
    mortgages: number; // Total mortgage payments (principal + interest + escrow + additional)
    total: number;
  };

  // Mortgage breakdown (separate from spending for tax deduction tracking)
  mortgagePayments: {
    principal: number; // Total principal paid across all mortgages
    interest: number; // Total interest paid (tax deductible)
    escrow: number; // Total escrow paid
    additionalPrincipal: number; // Total additional principal paid
    total: number; // Total mortgage payments
    byMortgage: import('./mortgages').AnnualMortgagePayment[]; // Breakdown by individual mortgage
  };

  // Contributions (inflated to year's dollars, by account TYPE)
  contributions: {
    total: number;
    byAccountType: Record<AccountType, number>;
  };

  netIncome: number;

  // Account balances (aggregated by account TYPE)
  accountBalances: {
    total: number;
    byAccountType: Record<AccountType, number>;
  };
}

export interface ProjectionSummary {
  startYear: number;
  endYear: number;
  totalIncome: number;
  totalSpending: number;
  totalContributions: number;
  finalNetWorth: number;
  yearsInDeficit: number;
  firstDeficitYear?: number;
}

export interface ScenarioProjection {
  scenarioId: string;
  scenarioName: string;
  years: AnnualProjection[];
  summary: ProjectionSummary;
}

export interface StoredProjection {
  id: string;
  username: string;
  scenarioId: string;
  scenarioName: string;
  calculatedAt: string;
  startYear: number;
  endYear: number;
  projection: ScenarioProjection;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalculateProjectionRequest {
  startYear?: number;
  endYear?: number;
}

export interface StoredProjectionResponse {
  success: boolean;
  storedProjection?: StoredProjection;
  error?: string;
}

export interface StoredProjectionsListResponse {
  success: boolean;
  storedProjections?: StoredProjection[];
  error?: string;
}

export interface ProjectionComparisonResponse {
  success: boolean;
  storedProjections?: StoredProjection[];
  error?: string;
}

const ACCOUNT_TYPES: AccountType[] = [
  '401k',
  'traditional-ira',
  'roth-ira',
  'brokerage',
  'savings',
  'checking',
];

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: string): number {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Aggregate account balances by account type
 */
function aggregateAccountsByType(accounts: Account[]): Record<AccountType, number> {
  const balances: Record<AccountType, number> = {
    '401k': 0,
    'traditional-ira': 0,
    'roth-ira': 0,
    'brokerage': 0,
    'savings': 0,
    'checking': 0,
  };

  for (const account of accounts) {
    if (account.status === 'active') {
      balances[account.accountType] += account.balance;
    }
  }

  return balances;
}

/**
 * Calculate inflation factor from base year
 */
function calculateInflationFactor(
  inflationRate: number,
  yearsFromBase: number
): number {
  return Math.pow(1 + inflationRate / 100, yearsFromBase);
}

/**
 * Apply investment returns to account balance
 */
function applyInvestmentReturns(
  balance: number,
  returnRate: number
): number {
  return balance * (returnRate / 100);
}

/**
 * Calculate scenario projection with year-by-year financial modeling
 *
 * Assumption Buckets:
 * - Scenarios are divided into age-based assumption buckets (e.g., working years, early retirement, late retirement)
 * - Each bucket defines financial assumptions for that life stage (income, spending, inflation rate, etc.)
 * - As the projection moves through years, it switches between buckets based on the user's age
 * - Example: Bucket A (30-55), Bucket B (56-65), Bucket C (66-90)
 *
 * Inflation Handling:
 * - Inflation compounds year-over-year using each year's bucket-specific rate
 * - This ensures smooth transitions between buckets with different inflation rates
 * - Example: 2% for 26 years, then 3% for 10 years, then 2.5% thereafter
 *
 * @param scenario - The scenario with assumption buckets and lump sum events
 * @param userProfile - User's profile (age calculation)
 * @param currentAccounts - Current account balances (aggregated by type)
 * @param startYear - Projection start year (typically current year)
 * @param endYear - Projection end year (calculated from max bucket age)
 * @returns Complete scenario projection with annual data and summary
 */
export function calculateScenarioProjection(
  scenario: Scenario,
  userProfile: UserProfile,
  currentAccounts: Account[],
  startYear: number,
  endYear: number
): ScenarioProjection {
  // Validate input parameters
  if (!scenario.assumptionBuckets || scenario.assumptionBuckets.length === 0) {
    throw new Error('Scenario must have at least one assumption bucket');
  }

  if (startYear > endYear) {
    throw new Error('Start year must be less than or equal to end year');
  }

  if (endYear - startYear > 100) {
    throw new Error('Projection period cannot exceed 100 years');
  }

  const currentAge = calculateAge(userProfile.dateOfBirth);
  const currentYear = new Date().getFullYear();
  const yearlyProjections: AnnualProjection[] = [];

  // Initialize balances by account TYPE (aggregate current accounts)
  const accountBalances = aggregateAccountsByType(currentAccounts);

  // Track cumulative inflation factor across bucket transitions
  // This compounds year-over-year as we move through different buckets with different rates
  let cumulativeInflationFactor = 1.0;

  for (let year = startYear; year <= endYear; year++) {
    const age = currentAge + (year - currentYear);

    // Get applicable assumption bucket for this age
    // Buckets define different financial assumptions for different life stages
    // e.g., Bucket A: working years, Bucket B: early retirement, Bucket C: late retirement
    const bucket = getBucketForAge(scenario.assumptionBuckets, age);

    if (!bucket) {
      // If no bucket applies, skip this year
      // This shouldn't happen if buckets are properly validated
      continue;
    }

    const assumptions = bucket.assumptions;

    // Apply this year's inflation rate to the cumulative factor
    // This ensures inflation compounds correctly across bucket transitions
    // Inflation rate is now scenario-level and applies uniformly across all years
    const yearInflationRate = scenario.inflationRate || 0;
    cumulativeInflationFactor *= (1 + yearInflationRate / 100);
    const inflationFactor = cumulativeInflationFactor;

    // === INCOME (apply inflation to assumptions) ===
    const employmentIncome =
      age < (scenario.retirementAge || 999)
        ? (assumptions.annualIncome || 0) * inflationFactor
        : 0;

    // Social Security is scenario-level and applies uniformly across all years
    const socialSecurityIncome =
      age >= (scenario.socialSecurityAge || 999)
        ? (scenario.socialSecurityIncome || 0) * inflationFactor
        : 0;

    // Lump sum income (NO inflation - already in actual dollars)
    const lumpSumIncome = scenario.lumpSumEvents
      .filter((e) => e.type === 'income' && e.age === age)
      .reduce((sum, e) => sum + e.amount, 0);

    // === SPENDING (apply inflation to assumptions) ===
    const livingSpending = (assumptions.annualSpending || 0) * inflationFactor;
    const travelSpending =
      (assumptions.annualTravelBudget || 0) * inflationFactor;
    const healthcareSpending =
      (assumptions.annualHealthcareCosts || 0) * inflationFactor;

    // Lump sum expenses (NO inflation - already in actual dollars)
    const lumpSumExpenses = scenario.lumpSumEvents
      .filter((e) => e.type === 'expense' && e.age === age)
      .reduce((sum, e) => sum + e.amount, 0);

    // === MORTGAGE PAYMENTS (NOT inflated - actual dollar amounts) ===
    const mortgagePaymentsForYear: AnnualMortgagePayment[] = [];
    let totalMortgagePrincipal = 0;
    let totalMortgageInterest = 0;
    let totalMortgageEscrow = 0;
    let totalMortgageAdditional = 0;

    for (const mortgage of scenario.mortgages || []) {
      const payment = getMortgagePaymentForYear(mortgage, year);
      if (payment) {
        mortgagePaymentsForYear.push(payment);
        totalMortgagePrincipal += payment.principal;
        totalMortgageInterest += payment.interest;
        totalMortgageEscrow += payment.escrow;
        totalMortgageAdditional += payment.additionalPrincipal;
      }
    }

    const totalMortgagePayments =
      totalMortgagePrincipal +
      totalMortgageInterest +
      totalMortgageEscrow +
      totalMortgageAdditional;

    // === CONTRIBUTIONS (apply inflation, by account TYPE) ===
    const contributionsByType: Record<AccountType, number> = {
      '401k': 0,
      'traditional-ira': 0,
      'roth-ira': 0,
      'brokerage': 0,
      'savings': 0,
      'checking': 0,
    };
    let totalContributions = 0;

    for (const accountType of ACCOUNT_TYPES) {
      const baseContribution = assumptions.contributions?.[accountType] || 0;
      const inflatedContribution = baseContribution * inflationFactor;
      contributionsByType[accountType] = inflatedContribution;
      totalContributions += inflatedContribution;
    }

    // === INVESTMENT RETURNS (same rate for all accounts) ===
    // Investment return rate is scenario-level and applies uniformly across all years
    const returnRate = scenario.investmentReturnRate || 0;
    let totalGains = 0;

    // Calculate returns on beginning balance (more realistic)
    for (const accountType of ACCOUNT_TYPES) {
      const beginningBalance = accountBalances[accountType] || 0;
      const contribution = contributionsByType[accountType] || 0;

      // Calculate returns on beginning balance
      const gain = applyInvestmentReturns(beginningBalance, returnRate);
      totalGains += gain;

      // Update balance: beginning + contributions + gains
      accountBalances[accountType] = beginningBalance + contribution + gain;
    }

    // === NET INCOME ===
    const totalIncome =
      employmentIncome + socialSecurityIncome + lumpSumIncome + totalGains;
    const totalSpending =
      livingSpending + travelSpending + healthcareSpending + lumpSumExpenses + totalMortgagePayments;
    const netIncome = totalIncome - totalSpending - totalContributions;

    // Adjust cash accounts for net income
    // IMPORTANT: Net income already accounts for contributions, so we don't double-count
    if (netIncome < 0) {
      // Need to withdraw from accounts to cover deficit
      let deficit = Math.abs(netIncome);

      // First withdraw from checking
      const checkingAvailable = accountBalances['checking'] || 0;
      const checkingWithdrawal = Math.min(deficit, checkingAvailable);
      accountBalances['checking'] = checkingAvailable - checkingWithdrawal;
      deficit -= checkingWithdrawal;

      // Then withdraw from savings if needed
      if (deficit > 0) {
        const savingsAvailable = accountBalances['savings'] || 0;
        const savingsWithdrawal = Math.min(deficit, savingsAvailable);
        accountBalances['savings'] = savingsAvailable - savingsWithdrawal;
        deficit -= savingsWithdrawal;
      }

      // If still deficit, accounts go negative (which is realistic for projections)
      if (deficit > 0) {
        accountBalances['checking'] -= deficit;
      }
    } else {
      // Add surplus to checking
      accountBalances['checking'] = (accountBalances['checking'] || 0) + netIncome;
    }

    // Store yearly projection
    yearlyProjections.push({
      year,
      age,
      income: {
        employment: employmentIncome,
        socialSecurity: socialSecurityIncome,
        lumpSum: lumpSumIncome,
        investmentGains: totalGains,
        total: totalIncome,
      },
      spending: {
        living: livingSpending,
        travel: travelSpending,
        healthcare: healthcareSpending,
        lumpSum: lumpSumExpenses,
        mortgages: totalMortgagePayments,
        total: totalSpending,
      },
      mortgagePayments: {
        principal: totalMortgagePrincipal,
        interest: totalMortgageInterest,
        escrow: totalMortgageEscrow,
        additionalPrincipal: totalMortgageAdditional,
        total: totalMortgagePayments,
        byMortgage: mortgagePaymentsForYear,
      },
      contributions: {
        total: totalContributions,
        byAccountType: { ...contributionsByType },
      },
      netIncome,
      accountBalances: {
        total: Object.values(accountBalances).reduce((sum, b) => sum + b, 0),
        byAccountType: { ...accountBalances },
      },
    });
  }

  // Calculate summary
  const summary = calculateProjectionSummary(yearlyProjections, startYear, endYear);

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    years: yearlyProjections,
    summary,
  };
}

/**
 * Calculate projection summary statistics
 */
export function calculateProjectionSummary(
  years: AnnualProjection[],
  startYear: number,
  endYear: number
): ProjectionSummary {
  let totalIncome = 0;
  let totalSpending = 0;
  let totalContributions = 0;
  let yearsInDeficit = 0;
  let firstDeficitYear: number | undefined;

  for (const year of years) {
    totalIncome += year.income.total;
    totalSpending += year.spending.total;
    totalContributions += year.contributions.total;

    if (year.netIncome < 0) {
      yearsInDeficit++;
      if (firstDeficitYear === undefined) {
        firstDeficitYear = year.year;
      }
    }
  }

  const finalNetWorth =
    years.length > 0 ? years[years.length - 1].accountBalances.total : 0;

  return {
    startYear,
    endYear,
    totalIncome,
    totalSpending,
    totalContributions,
    finalNetWorth,
    yearsInDeficit,
    firstDeficitYear,
  };
}
