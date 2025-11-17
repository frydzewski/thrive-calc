/**
 * Mortgage Types and Amortization Calculations
 *
 * This module handles mortgage modeling within scenarios, including:
 * - Standard mortgage amortization
 * - Support for multiple mortgages per scenario
 * - Future-dated mortgages (e.g., buying a vacation home in 5 years)
 * - Additional monthly payments
 * - Separate tracking of principal, interest, and escrow
 */

export interface Mortgage {
  id: string;
  name: string; // e.g., "Primary Home", "Vacation Property"
  startDate: string; // ISO date string (YYYY-MM-DD)
  loanAmount: number; // Original loan amount
  termYears: number; // Loan term in years (typically 15 or 30)
  interestRate: number; // Annual interest rate as percentage (e.g., 6.5)
  monthlyEscrow: number; // Monthly escrow payment (taxes + insurance)
  additionalMonthlyPayment?: number; // Optional additional principal payment
  description?: string; // Optional notes about this mortgage
}

export interface MortgagePayment {
  month: number; // Month number (1-360 for 30-year mortgage)
  year: number; // Calendar year
  principal: number; // Principal payment for this month
  interest: number; // Interest payment for this month
  escrow: number; // Escrow payment for this month
  additionalPrincipal: number; // Additional principal payment for this month
  totalPayment: number; // Total payment for this month
  remainingBalance: number; // Remaining principal balance after this payment
}

export interface AnnualMortgagePayment {
  year: number; // Calendar year
  mortgageId: string;
  mortgageName: string;
  principal: number; // Total principal paid this year
  interest: number; // Total interest paid this year
  escrow: number; // Total escrow paid this year
  additionalPrincipal: number; // Total additional principal paid this year
  totalPayment: number; // Total payments this year
  startingBalance: number; // Balance at start of year
  endingBalance: number; // Balance at end of year
}

/**
 * Calculate monthly mortgage payment (principal + interest only, excludes escrow)
 * Using standard mortgage formula: M = P[r(1+r)^n]/[(1+r)^n-1]
 *
 * @param principal - Loan amount
 * @param annualRate - Annual interest rate as percentage (e.g., 6.5)
 * @param termYears - Loan term in years
 * @returns Monthly payment amount (principal + interest)
 */
export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number
): number {
  if (principal <= 0 || annualRate < 0 || termYears <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = termYears * 12;

  // Handle edge case: 0% interest rate
  if (annualRate === 0) {
    return principal / numberOfPayments;
  }

  const payment =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  return payment;
}

/**
 * Generate full amortization schedule for a mortgage
 *
 * @param mortgage - Mortgage details
 * @returns Array of monthly payments for the life of the loan
 */
export function generateAmortizationSchedule(mortgage: Mortgage): MortgagePayment[] {
  const schedule: MortgagePayment[] = [];
  const monthlyRate = mortgage.interestRate / 100 / 12;
  const numberOfPayments = mortgage.termYears * 12;
  const monthlyPayment = calculateMonthlyPayment(
    mortgage.loanAmount,
    mortgage.interestRate,
    mortgage.termYears
  );
  const additionalPayment = mortgage.additionalMonthlyPayment || 0;

  let remainingBalance = mortgage.loanAmount;

  // Parse date in local timezone to avoid UTC/local timezone issues
  const [year, monthStr, day] = mortgage.startDate.split('-').map(Number);
  const startDate = new Date(year, monthStr - 1, day);

  for (let month = 1; month <= numberOfPayments && remainingBalance > 0.01; month++) {
    // Calculate interest for this month
    const interestPayment = remainingBalance * monthlyRate;

    // Calculate principal payment (excluding additional)
    let principalPayment = monthlyPayment - interestPayment;

    // Apply additional principal payment
    let additionalPrincipal = additionalPayment;

    // Don't overpay - cap at remaining balance
    const totalPrincipal = principalPayment + additionalPrincipal;
    if (totalPrincipal > remainingBalance) {
      // Last payment - adjust to pay off exactly
      principalPayment = remainingBalance;
      additionalPrincipal = 0;
    }

    // Calculate payment date
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + (month - 1));
    const paymentYear = paymentDate.getFullYear();

    // Update remaining balance
    remainingBalance -= (principalPayment + additionalPrincipal);

    schedule.push({
      month,
      year: paymentYear,
      principal: principalPayment,
      interest: interestPayment,
      escrow: mortgage.monthlyEscrow,
      additionalPrincipal,
      totalPayment: principalPayment + interestPayment + mortgage.monthlyEscrow + additionalPrincipal,
      remainingBalance: Math.max(0, remainingBalance),
    });

    // Break if loan is paid off early due to additional payments
    if (remainingBalance <= 0.01) {
      break;
    }
  }

  return schedule;
}

/**
 * Aggregate monthly mortgage payments into annual totals
 *
 * @param schedule - Full amortization schedule
 * @param mortgageId - Mortgage ID
 * @param mortgageName - Mortgage name
 * @returns Array of annual payment summaries
 */
export function aggregateToAnnualPayments(
  schedule: MortgagePayment[],
  mortgageId: string,
  mortgageName: string
): AnnualMortgagePayment[] {
  const annualPayments: Map<number, AnnualMortgagePayment> = new Map();

  for (const payment of schedule) {
    const year = payment.year;

    if (!annualPayments.has(year)) {
      annualPayments.set(year, {
        year,
        mortgageId,
        mortgageName,
        principal: 0,
        interest: 0,
        escrow: 0,
        additionalPrincipal: 0,
        totalPayment: 0,
        startingBalance: payment.remainingBalance + payment.principal + payment.additionalPrincipal,
        endingBalance: 0,
      });
    }

    const annual = annualPayments.get(year)!;
    annual.principal += payment.principal;
    annual.interest += payment.interest;
    annual.escrow += payment.escrow;
    annual.additionalPrincipal += payment.additionalPrincipal;
    annual.totalPayment += payment.totalPayment;
    annual.endingBalance = payment.remainingBalance;
  }

  return Array.from(annualPayments.values()).sort((a, b) => a.year - b.year);
}

/**
 * Get mortgage payments for a specific year
 *
 * @param mortgage - Mortgage details
 * @param year - Calendar year
 * @returns Annual mortgage payment summary for the specified year, or null if mortgage is not active
 */
export function getMortgagePaymentForYear(
  mortgage: Mortgage,
  year: number
): AnnualMortgagePayment | null {
  // Parse date in local timezone to avoid UTC/local timezone issues
  const [startYear, monthStr, day] = mortgage.startDate.split('-').map(Number);
  const endYear = startYear + mortgage.termYears;

  // Check if mortgage is active in this year
  if (year < startYear || year >= endYear) {
    return null;
  }

  // Generate full schedule and find payments for this year
  const schedule = generateAmortizationSchedule(mortgage);
  const yearPayments = schedule.filter(p => p.year === year);

  if (yearPayments.length === 0) {
    return null;
  }

  // Aggregate payments for this year
  const firstPayment = yearPayments[0];
  const lastPayment = yearPayments[yearPayments.length - 1];

  return {
    year,
    mortgageId: mortgage.id,
    mortgageName: mortgage.name,
    principal: yearPayments.reduce((sum, p) => sum + p.principal, 0),
    interest: yearPayments.reduce((sum, p) => sum + p.interest, 0),
    escrow: yearPayments.reduce((sum, p) => sum + p.escrow, 0),
    additionalPrincipal: yearPayments.reduce((sum, p) => sum + p.additionalPrincipal, 0),
    totalPayment: yearPayments.reduce((sum, p) => sum + p.totalPayment, 0),
    startingBalance: firstPayment.remainingBalance + firstPayment.principal + firstPayment.additionalPrincipal,
    endingBalance: lastPayment.remainingBalance,
  };
}

/**
 * Check if a mortgage is active in a given year
 *
 * @param mortgage - Mortgage details
 * @param year - Calendar year to check
 * @returns True if mortgage has payments in this year
 */
export function isMortgageActive(mortgage: Mortgage, year: number): boolean {
  // Parse date in local timezone to avoid UTC/local timezone issues
  const [startYear, monthStr, day] = mortgage.startDate.split('-').map(Number);

  // Calculate actual payoff year (may be earlier than term due to additional payments)
  // For now, use term years as approximation
  const endYear = startYear + mortgage.termYears;

  return year >= startYear && year < endYear;
}

/**
 * Validate mortgage data
 *
 * @param mortgage - Mortgage data to validate
 * @returns Error message if invalid, null if valid
 */
export function validateMortgage(mortgage: Partial<Mortgage>): string | null {
  if (!mortgage.name || mortgage.name.trim().length === 0) {
    return 'Mortgage name is required';
  }

  if (!mortgage.startDate) {
    return 'Mortgage start date is required';
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(mortgage.startDate)) {
    return 'Invalid start date format (expected YYYY-MM-DD)';
  }

  if (typeof mortgage.loanAmount !== 'number' || mortgage.loanAmount <= 0) {
    return 'Loan amount must be greater than 0';
  }

  if (typeof mortgage.termYears !== 'number' || mortgage.termYears <= 0 || mortgage.termYears > 50) {
    return 'Term must be between 1 and 50 years';
  }

  if (typeof mortgage.interestRate !== 'number' || mortgage.interestRate < 0 || mortgage.interestRate > 30) {
    return 'Interest rate must be between 0 and 30%';
  }

  if (typeof mortgage.monthlyEscrow !== 'number' || mortgage.monthlyEscrow < 0) {
    return 'Monthly escrow must be 0 or greater';
  }

  if (mortgage.additionalMonthlyPayment !== undefined) {
    if (typeof mortgage.additionalMonthlyPayment !== 'number' || mortgage.additionalMonthlyPayment < 0) {
      return 'Additional monthly payment must be 0 or greater';
    }
  }

  return null;
}
