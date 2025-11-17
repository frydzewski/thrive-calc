/**
 * Tests for mortgage amortization calculations
 */

import {
  Mortgage,
  calculateMonthlyPayment,
  generateAmortizationSchedule,
  aggregateToAnnualPayments,
  getMortgagePaymentForYear,
  isMortgageActive,
  validateMortgage,
} from '../mortgages';

describe('Mortgage Calculations', () => {
  const sampleMortgage: Mortgage = {
    id: '123',
    name: 'Primary Home',
    startDate: '2024-01-01',
    loanAmount: 400000,
    termYears: 30,
    interestRate: 6.5,
    monthlyEscrow: 500,
    additionalMonthlyPayment: 0,
  };

  describe('calculateMonthlyPayment', () => {
    it('should calculate correct monthly payment for standard mortgage', () => {
      const payment = calculateMonthlyPayment(400000, 6.5, 30);
      // Expected: ~$2,528 (principal + interest only, no escrow)
      expect(payment).toBeGreaterThan(2500);
      expect(payment).toBeLessThan(2600);
    });

    it('should handle 0% interest rate', () => {
      const payment = calculateMonthlyPayment(400000, 0, 30);
      // With 0% interest, payment is just principal / number of months
      expect(payment).toBeCloseTo(400000 / (30 * 12), 2);
    });

    it('should handle 15-year mortgage', () => {
      const payment = calculateMonthlyPayment(400000, 6.5, 15);
      // 15-year should have higher monthly payment than 30-year
      const payment30 = calculateMonthlyPayment(400000, 6.5, 30);
      expect(payment).toBeGreaterThan(payment30);
    });

    it('should return 0 for invalid inputs', () => {
      expect(calculateMonthlyPayment(0, 6.5, 30)).toBe(0);
      expect(calculateMonthlyPayment(400000, 0, 0)).toBe(0);
      expect(calculateMonthlyPayment(-100000, 6.5, 30)).toBe(0);
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate full schedule for 30-year mortgage', () => {
      const schedule = generateAmortizationSchedule(sampleMortgage);

      // Should have 360 payments (30 years * 12 months)
      expect(schedule.length).toBe(360);

      // First payment should have more interest than principal
      expect(schedule[0].interest).toBeGreaterThan(schedule[0].principal);

      // Last payment should have more principal than interest
      const lastPayment = schedule[schedule.length - 1];
      expect(lastPayment.principal).toBeGreaterThan(lastPayment.interest);

      // Final balance should be close to 0
      expect(lastPayment.remainingBalance).toBeLessThan(1);
    });

    it('should include escrow in every payment', () => {
      const schedule = generateAmortizationSchedule(sampleMortgage);

      schedule.forEach(payment => {
        expect(payment.escrow).toBe(500);
      });
    });

    it('should handle additional monthly payments', () => {
      const mortgageWithExtra: Mortgage = {
        ...sampleMortgage,
        additionalMonthlyPayment: 200,
      };

      const scheduleWithExtra = generateAmortizationSchedule(mortgageWithExtra);
      const scheduleWithout = generateAmortizationSchedule(sampleMortgage);

      // Additional payments should pay off loan faster
      expect(scheduleWithExtra.length).toBeLessThan(scheduleWithout.length);

      // Should have additional principal in each payment
      expect(scheduleWithExtra[0].additionalPrincipal).toBe(200);
    });

    it('should assign correct years to payments', () => {
      const schedule = generateAmortizationSchedule(sampleMortgage);

      // First payment should be in 2024
      expect(schedule[0].year).toBe(2024);

      // Payment in month 13 should be in 2025
      expect(schedule[12].year).toBe(2025);

      // Last payment should be 30 years later
      const lastPayment = schedule[schedule.length - 1];
      expect(lastPayment.year).toBe(2024 + 29); // Starts in 2024, ends in 2053
    });

    it('should reduce balance with each payment', () => {
      const schedule = generateAmortizationSchedule(sampleMortgage);

      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].remainingBalance).toBeLessThan(schedule[i - 1].remainingBalance);
      }
    });
  });

  describe('aggregateToAnnualPayments', () => {
    it('should aggregate monthly payments into annual totals', () => {
      const schedule = generateAmortizationSchedule(sampleMortgage);
      const annualPayments = aggregateToAnnualPayments(schedule, sampleMortgage.id, sampleMortgage.name);

      // Should have 30 years of payments
      expect(annualPayments.length).toBe(30);

      // First year
      const firstYear = annualPayments[0];
      expect(firstYear.year).toBe(2024);
      expect(firstYear.mortgageId).toBe(sampleMortgage.id);
      expect(firstYear.mortgageName).toBe(sampleMortgage.name);

      // Should have 12 months of escrow
      expect(firstYear.escrow).toBeCloseTo(500 * 12, 0);

      // Total payment should equal sum of components
      expect(firstYear.totalPayment).toBeCloseTo(
        firstYear.principal + firstYear.interest + firstYear.escrow + firstYear.additionalPrincipal,
        2
      );

      // Ending balance of first year should equal starting balance of second year
      expect(firstYear.endingBalance).toBeCloseTo(annualPayments[1].startingBalance, 2);
    });

    it('should show decreasing interest over time', () => {
      const schedule = generateAmortizationSchedule(sampleMortgage);
      const annualPayments = aggregateToAnnualPayments(schedule, sampleMortgage.id, sampleMortgage.name);

      // Interest should decrease year over year
      for (let i = 1; i < annualPayments.length; i++) {
        expect(annualPayments[i].interest).toBeLessThan(annualPayments[i - 1].interest);
      }
    });

    it('should show increasing principal over time', () => {
      const schedule = generateAmortizationSchedule(sampleMortgage);
      const annualPayments = aggregateToAnnualPayments(schedule, sampleMortgage.id, sampleMortgage.name);

      // Principal should increase year over year
      for (let i = 1; i < annualPayments.length; i++) {
        expect(annualPayments[i].principal).toBeGreaterThan(annualPayments[i - 1].principal);
      }
    });
  });

  describe('getMortgagePaymentForYear', () => {
    it('should return payment for year when mortgage is active', () => {
      const payment = getMortgagePaymentForYear(sampleMortgage, 2024);

      expect(payment).not.toBeNull();
      expect(payment?.year).toBe(2024);
      expect(payment?.mortgageId).toBe(sampleMortgage.id);
    });

    it('should return null for year before mortgage starts', () => {
      const payment = getMortgagePaymentForYear(sampleMortgage, 2023);
      expect(payment).toBeNull();
    });

    it('should return null for year after mortgage ends', () => {
      const payment = getMortgagePaymentForYear(sampleMortgage, 2055);
      expect(payment).toBeNull();
    });

    it('should handle future-dated mortgages', () => {
      const futureMortgage: Mortgage = {
        ...sampleMortgage,
        startDate: '2030-01-01',
      };

      expect(getMortgagePaymentForYear(futureMortgage, 2029)).toBeNull();
      expect(getMortgagePaymentForYear(futureMortgage, 2030)).not.toBeNull();
    });
  });

  describe('isMortgageActive', () => {
    it('should return true for years when mortgage is active', () => {
      expect(isMortgageActive(sampleMortgage, 2024)).toBe(true);
      expect(isMortgageActive(sampleMortgage, 2030)).toBe(true);
      expect(isMortgageActive(sampleMortgage, 2050)).toBe(true);
    });

    it('should return false for years before mortgage starts', () => {
      expect(isMortgageActive(sampleMortgage, 2023)).toBe(false);
      expect(isMortgageActive(sampleMortgage, 2020)).toBe(false);
    });

    it('should return false for years after mortgage ends', () => {
      expect(isMortgageActive(sampleMortgage, 2054)).toBe(false);
      expect(isMortgageActive(sampleMortgage, 2055)).toBe(false);
    });
  });

  describe('validateMortgage', () => {
    it('should accept valid mortgage', () => {
      expect(validateMortgage(sampleMortgage)).toBeNull();
    });

    it('should reject mortgage without name', () => {
      const invalid = { ...sampleMortgage, name: '' };
      expect(validateMortgage(invalid)).toContain('name is required');
    });

    it('should reject mortgage without start date', () => {
      const invalid = { ...sampleMortgage, startDate: undefined as any };
      expect(validateMortgage(invalid)).toContain('start date is required');
    });

    it('should reject mortgage with invalid date format', () => {
      const invalid = { ...sampleMortgage, startDate: '01/01/2024' };
      expect(validateMortgage(invalid)).toContain('Invalid start date format');
    });

    it('should reject mortgage with invalid loan amount', () => {
      const invalid1 = { ...sampleMortgage, loanAmount: 0 };
      const invalid2 = { ...sampleMortgage, loanAmount: -100000 };

      expect(validateMortgage(invalid1)).toContain('Loan amount must be greater than 0');
      expect(validateMortgage(invalid2)).toContain('Loan amount must be greater than 0');
    });

    it('should reject mortgage with invalid term', () => {
      const invalid1 = { ...sampleMortgage, termYears: 0 };
      const invalid2 = { ...sampleMortgage, termYears: 100 };

      expect(validateMortgage(invalid1)).toContain('Term must be between 1 and 50 years');
      expect(validateMortgage(invalid2)).toContain('Term must be between 1 and 50 years');
    });

    it('should reject mortgage with invalid interest rate', () => {
      const invalid1 = { ...sampleMortgage, interestRate: -1 };
      const invalid2 = { ...sampleMortgage, interestRate: 50 };

      expect(validateMortgage(invalid1)).toContain('Interest rate must be between 0 and 30%');
      expect(validateMortgage(invalid2)).toContain('Interest rate must be between 0 and 30%');
    });

    it('should reject mortgage with negative escrow', () => {
      const invalid = { ...sampleMortgage, monthlyEscrow: -100 };
      expect(validateMortgage(invalid)).toContain('Monthly escrow must be 0 or greater');
    });

    it('should reject mortgage with negative additional payment', () => {
      const invalid = { ...sampleMortgage, additionalMonthlyPayment: -50 };
      expect(validateMortgage(invalid)).toContain('Additional monthly payment must be 0 or greater');
    });

    it('should accept mortgage with 0 escrow', () => {
      const valid = { ...sampleMortgage, monthlyEscrow: 0 };
      expect(validateMortgage(valid)).toBeNull();
    });

    it('should accept mortgage without additional payment', () => {
      const valid = { ...sampleMortgage, additionalMonthlyPayment: undefined };
      expect(validateMortgage(valid)).toBeNull();
    });
  });

  describe('Real-world mortgage scenario', () => {
    it('should correctly model a typical 30-year $400k mortgage at 6.5%', () => {
      const mortgage: Mortgage = {
        id: 'test-123',
        name: 'Primary Residence',
        startDate: '2024-01-01',
        loanAmount: 400000,
        termYears: 30,
        interestRate: 6.5,
        monthlyEscrow: 500,
        additionalMonthlyPayment: 0,
      };

      const schedule = generateAmortizationSchedule(mortgage);
      const annualPayments = aggregateToAnnualPayments(schedule, mortgage.id, mortgage.name);

      // Verify first year
      const firstYear = annualPayments[0];
      expect(firstYear.year).toBe(2024);

      // First year should have mostly interest
      expect(firstYear.interest).toBeGreaterThan(firstYear.principal);

      // Total interest paid should be significant
      const totalInterest = annualPayments.reduce((sum, p) => sum + p.interest, 0);
      expect(totalInterest).toBeGreaterThan(500000); // More than the loan amount

      // Final balance should be near zero
      const lastYear = annualPayments[annualPayments.length - 1];
      expect(lastYear.endingBalance).toBeLessThan(10);
    });

    it('should model buying a vacation home in 5 years', () => {
      const vacationHome: Mortgage = {
        id: 'vacation-456',
        name: 'Lake House',
        startDate: '2029-06-01', // Future date
        loanAmount: 250000,
        termYears: 15,
        interestRate: 7.0,
        monthlyEscrow: 300,
        additionalMonthlyPayment: 0,
      };

      // Should not be active in 2024-2028
      expect(isMortgageActive(vacationHome, 2024)).toBe(false);
      expect(isMortgageActive(vacationHome, 2028)).toBe(false);

      // Should be active starting 2029
      expect(isMortgageActive(vacationHome, 2029)).toBe(true);
      expect(isMortgageActive(vacationHome, 2030)).toBe(true);

      // Should end around 2044 (2029 + 15 years)
      expect(isMortgageActive(vacationHome, 2043)).toBe(true);
      expect(isMortgageActive(vacationHome, 2044)).toBe(false);
    });

    it('should model aggressive payoff with additional monthly payments', () => {
      const mortgageNoExtra = sampleMortgage;
      const mortgageWithExtra: Mortgage = {
        ...sampleMortgage,
        additionalMonthlyPayment: 500,
      };

      const scheduleNoExtra = generateAmortizationSchedule(mortgageNoExtra);
      const scheduleWithExtra = generateAmortizationSchedule(mortgageWithExtra);

      // With $500 extra per month, should pay off significantly faster
      expect(scheduleWithExtra.length).toBeLessThan(scheduleNoExtra.length);

      // Should save years of payments
      const yearsSaved = (scheduleNoExtra.length - scheduleWithExtra.length) / 12;
      expect(yearsSaved).toBeGreaterThan(5); // Should save at least 5 years
    });
  });
});
