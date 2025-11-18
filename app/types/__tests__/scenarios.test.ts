/**
 * Tests for scenario validation and utility functions
 */

import {
  validateLumpSumEvent,
  validateAssumptions,
  validateAssumptionBucket,
  validateBuckets,
  validateCreateScenario,
  validateUpdateScenario,
  getBucketForAge,
  mergeAssumptions,
  AssumptionBucket,
  Assumptions,
} from '../scenarios';

describe('Scenario Validation and Utilities', () => {
  describe('validateLumpSumEvent', () => {
    it('should accept valid income event', () => {
      const event = {
        type: 'income',
        age: 40,
        amount: 100000,
        description: 'Inheritance',
      };
      expect(validateLumpSumEvent(event)).toBeNull();
    });

    it('should accept valid expense event', () => {
      const event = {
        type: 'expense',
        age: 35,
        amount: 50000,
        description: 'Car purchase',
      };
      expect(validateLumpSumEvent(event)).toBeNull();
    });

    it('should reject null or non-object', () => {
      expect(validateLumpSumEvent(null)).toContain('must be an object');
      expect(validateLumpSumEvent('invalid')).toContain('must be an object');
      expect(validateLumpSumEvent(123)).toContain('must be an object');
    });

    it('should reject invalid type', () => {
      const event = {
        type: 'invalid',
        age: 40,
        amount: 100000,
        description: 'Test',
      };
      expect(validateLumpSumEvent(event)).toContain('type must be');
    });

    it('should reject missing type', () => {
      const event = {
        age: 40,
        amount: 100000,
        description: 'Test',
      };
      expect(validateLumpSumEvent(event)).toContain('type must be');
    });

    it('should reject invalid age', () => {
      expect(
        validateLumpSumEvent({
          type: 'income',
          age: -1,
          amount: 100000,
          description: 'Test',
        })
      ).toContain('age must be');

      expect(
        validateLumpSumEvent({
          type: 'income',
          age: 121,
          amount: 100000,
          description: 'Test',
        })
      ).toContain('age must be');

      expect(
        validateLumpSumEvent({
          type: 'income',
          age: 'invalid',
          amount: 100000,
          description: 'Test',
        })
      ).toContain('age must be');
    });

    it('should reject negative amount', () => {
      const event = {
        type: 'income',
        age: 40,
        amount: -100,
        description: 'Test',
      };
      expect(validateLumpSumEvent(event)).toContain('amount must be');
    });

    it('should reject missing or empty description', () => {
      expect(
        validateLumpSumEvent({
          type: 'income',
          age: 40,
          amount: 100000,
        })
      ).toContain('description must be');

      expect(
        validateLumpSumEvent({
          type: 'income',
          age: 40,
          amount: 100000,
          description: '',
        })
      ).toContain('description must be');

      expect(
        validateLumpSumEvent({
          type: 'income',
          age: 40,
          amount: 100000,
          description: '   ',
        })
      ).toContain('description must be');
    });
  });

  describe('validateAssumptions', () => {
    it('should accept valid assumptions', () => {
      const assumptions = {
        annualIncome: 100000,
        annualSpending: 60000,
        annualTravelBudget: 10000,
        annualHealthcareCosts: 5000,
        contributions: {
          '401k': 20000,
          'roth-ira': 6500,
          brokerage: 5000,
        },
      };
      expect(validateAssumptions(assumptions)).toBeNull();
    });

    it('should accept empty assumptions object', () => {
      expect(validateAssumptions({})).toBeNull();
    });

    it('should reject null or non-object', () => {
      expect(validateAssumptions(null)).toContain('must be an object');
      expect(validateAssumptions('invalid')).toContain('must be an object');
    });

    it('should reject negative annual income', () => {
      const assumptions = {
        annualIncome: -1000,
      };
      expect(validateAssumptions(assumptions)).toContain('Annual income');
    });

    it('should reject negative annual spending', () => {
      const assumptions = {
        annualSpending: -5000,
      };
      expect(validateAssumptions(assumptions)).toContain('Annual spending');
    });

    it('should reject negative travel budget', () => {
      const assumptions = {
        annualTravelBudget: -2000,
      };
      expect(validateAssumptions(assumptions)).toContain('travel budget');
    });

    it('should reject negative healthcare costs', () => {
      const assumptions = {
        annualHealthcareCosts: -1000,
      };
      expect(validateAssumptions(assumptions)).toContain('healthcare costs');
    });

    it('should reject invalid account type in contributions', () => {
      const assumptions = {
        contributions: {
          'invalid-account': 5000,
        },
      };
      expect(validateAssumptions(assumptions)).toContain('Invalid account type');
    });

    it('should reject negative contribution amount', () => {
      const assumptions = {
        contributions: {
          '401k': -1000,
        },
      };
      expect(validateAssumptions(assumptions)).toContain('must be a non-negative number');
    });

    it('should reject non-object contributions', () => {
      const assumptions = {
        contributions: 'invalid',
      };
      expect(validateAssumptions(assumptions)).toContain('Contributions must be an object');
    });
  });

  describe('validateAssumptionBucket', () => {
    it('should accept valid bucket', () => {
      const bucket = {
        order: 0,
        startAge: 30,
        endAge: 65,
        assumptions: {
          annualIncome: 100000,
          annualSpending: 60000,
        },
      };
      expect(validateAssumptionBucket(bucket)).toBeNull();
    });

    it('should reject null or non-object', () => {
      expect(validateAssumptionBucket(null)).toContain('must be an object');
      expect(validateAssumptionBucket('invalid')).toContain('must be an object');
    });

    it('should reject negative order', () => {
      const bucket = {
        order: -1,
        startAge: 30,
        endAge: 65,
        assumptions: {},
      };
      expect(validateAssumptionBucket(bucket)).toContain('order must be');
    });

    it('should reject invalid start age', () => {
      expect(
        validateAssumptionBucket({
          order: 0,
          startAge: -1,
          endAge: 65,
          assumptions: {},
        })
      ).toContain('start age must be');

      expect(
        validateAssumptionBucket({
          order: 0,
          startAge: 121,
          endAge: 65,
          assumptions: {},
        })
      ).toContain('start age must be');
    });

    it('should reject invalid end age', () => {
      expect(
        validateAssumptionBucket({
          order: 0,
          startAge: 30,
          endAge: -1,
          assumptions: {},
        })
      ).toContain('end age must be');

      expect(
        validateAssumptionBucket({
          order: 0,
          startAge: 30,
          endAge: 1000,
          assumptions: {},
        })
      ).toContain('end age must be');
    });

    it('should reject start age greater than end age', () => {
      const bucket = {
        order: 0,
        startAge: 65,
        endAge: 30,
        assumptions: {},
      };
      expect(validateAssumptionBucket(bucket)).toContain('start age must be less than');
    });

    it('should reject bucket without assumptions', () => {
      const bucket = {
        order: 0,
        startAge: 30,
        endAge: 65,
      };
      expect(validateAssumptionBucket(bucket)).toContain('must have assumptions');
    });

    it('should validate assumptions within bucket', () => {
      const bucket = {
        order: 0,
        startAge: 30,
        endAge: 65,
        assumptions: {
          annualIncome: -1000, // Invalid
        },
      };
      expect(validateAssumptionBucket(bucket)).toContain('Annual income');
    });
  });

  describe('validateBuckets', () => {
    it('should accept valid sequential buckets', () => {
      const buckets: AssumptionBucket[] = [
        {
          id: '1',
          order: 0,
          startAge: 30,
          endAge: 64,
          assumptions: {},
        },
        {
          id: '2',
          order: 1,
          startAge: 65,
          endAge: 95,
          assumptions: {},
        },
      ];
      expect(validateBuckets(buckets)).toBeNull();
    });

    it('should reject empty bucket array', () => {
      expect(validateBuckets([])).toContain('at least one');
    });

    it('should reject non-sequential order numbers', () => {
      const buckets: AssumptionBucket[] = [
        {
          id: '1',
          order: 0,
          startAge: 30,
          endAge: 64,
          assumptions: {},
        },
        {
          id: '2',
          order: 2, // Should be 1
          startAge: 65,
          endAge: 95,
          assumptions: {},
        },
      ];
      expect(validateBuckets(buckets)).toContain('must be sequential');
    });

    it('should reject buckets with gaps', () => {
      const buckets: AssumptionBucket[] = [
        {
          id: '1',
          order: 0,
          startAge: 30,
          endAge: 64,
          assumptions: {},
        },
        {
          id: '2',
          order: 1,
          startAge: 70, // Gap between 64 and 70
          endAge: 95,
          assumptions: {},
        },
      ];
      expect(validateBuckets(buckets)).toContain('Gap between');
    });

    it('should reject buckets with overlaps', () => {
      const buckets: AssumptionBucket[] = [
        {
          id: '1',
          order: 0,
          startAge: 30,
          endAge: 65,
          assumptions: {},
        },
        {
          id: '2',
          order: 1,
          startAge: 65, // Overlaps with previous bucket
          endAge: 95,
          assumptions: {},
        },
      ];
      expect(validateBuckets(buckets)).toContain('overlap');
    });
  });

  describe('validateCreateScenario', () => {
    const validScenario = {
      name: 'Test Scenario',
      description: 'Test description',
      assumptionBuckets: [
        {
          order: 0,
          startAge: 30,
          endAge: 64,
          assumptions: {
            annualIncome: 100000,
            annualSpending: 60000,
          },
        },
        {
          order: 1,
          startAge: 65,
          endAge: 95,
          assumptions: {
            annualIncome: 0,
            annualSpending: 50000,
          },
        },
      ],
      lumpSumEvents: [],
      mortgages: [],
    };

    it('should accept valid scenario', () => {
      expect(validateCreateScenario(validScenario)).toBeNull();
    });

    it('should reject null or non-object', () => {
      expect(validateCreateScenario(null)).toContain('must be an object');
      expect(validateCreateScenario('invalid')).toContain('must be an object');
    });

    it('should reject missing or empty name', () => {
      expect(validateCreateScenario({ ...validScenario, name: undefined })).toContain(
        'name is required'
      );
      expect(validateCreateScenario({ ...validScenario, name: '' })).toContain(
        'name is required'
      );
      expect(validateCreateScenario({ ...validScenario, name: '   ' })).toContain(
        'name is required'
      );
    });

    it('should reject name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(validateCreateScenario({ ...validScenario, name: longName })).toContain(
        '100 characters or less'
      );
    });

    it('should reject non-string description', () => {
      expect(validateCreateScenario({ ...validScenario, description: 123 })).toContain(
        'description must be a string'
      );
    });

    it('should accept undefined description', () => {
      expect(validateCreateScenario({ ...validScenario, description: undefined })).toBeNull();
    });

    it('should reject missing assumption buckets', () => {
      const { assumptionBuckets, ...rest } = validScenario;
      expect(validateCreateScenario(rest)).toContain('assumption buckets');
    });

    it('should reject non-array assumption buckets', () => {
      expect(
        validateCreateScenario({ ...validScenario, assumptionBuckets: 'invalid' })
      ).toContain('assumption buckets');
    });

    it('should validate individual buckets', () => {
      const scenarioWithInvalidBucket = {
        ...validScenario,
        assumptionBuckets: [
          {
            order: 0,
            startAge: 65, // Invalid: start > end
            endAge: 30,
            assumptions: {},
          },
        ],
      };
      expect(validateCreateScenario(scenarioWithInvalidBucket)).toContain('start age');
    });

    it('should validate bucket sequence', () => {
      const scenarioWithGap = {
        ...validScenario,
        assumptionBuckets: [
          {
            order: 0,
            startAge: 30,
            endAge: 64,
            assumptions: {},
          },
          {
            order: 1,
            startAge: 70, // Gap
            endAge: 95,
            assumptions: {},
          },
        ],
      };
      expect(validateCreateScenario(scenarioWithGap)).toContain('Gap');
    });

    it('should reject non-array lump sum events', () => {
      expect(validateCreateScenario({ ...validScenario, lumpSumEvents: 'invalid' })).toContain(
        'Lump sum events must be an array'
      );
    });

    it('should validate lump sum events', () => {
      const scenarioWithInvalidEvent = {
        ...validScenario,
        lumpSumEvents: [
          {
            type: 'income',
            age: -1, // Invalid
            amount: 100000,
            description: 'Test',
          },
        ],
      };
      expect(validateCreateScenario(scenarioWithInvalidEvent)).toContain('age must be');
    });

    it('should reject non-array mortgages', () => {
      expect(validateCreateScenario({ ...validScenario, mortgages: 'invalid' })).toContain(
        'Mortgages must be an array'
      );
    });

    it('should validate mortgages', () => {
      const scenarioWithInvalidMortgage = {
        ...validScenario,
        mortgages: [
          {
            name: '', // Invalid
            startDate: '2024-01-01',
            loanAmount: 400000,
            termYears: 30,
            interestRate: 6.5,
            monthlyEscrow: 500,
          },
        ],
      };
      expect(validateCreateScenario(scenarioWithInvalidMortgage)).toContain('name is required');
    });
  });

  describe('validateUpdateScenario', () => {
    it('should accept valid update with all fields', () => {
      const update = {
        name: 'Updated Name',
        description: 'Updated description',
        assumptionBuckets: [
          {
            id: '1',
            order: 0,
            startAge: 30,
            endAge: 64,
            assumptions: {},
          },
          {
            id: '2',
            order: 1,
            startAge: 65,
            endAge: 95,
            assumptions: {},
          },
        ],
        lumpSumEvents: [],
        mortgages: [],
        isDefault: true,
      };
      expect(validateUpdateScenario(update)).toBeNull();
    });

    it('should accept empty update object', () => {
      expect(validateUpdateScenario({})).toBeNull();
    });

    it('should reject null or non-object', () => {
      expect(validateUpdateScenario(null)).toContain('must be an object');
      expect(validateUpdateScenario('invalid')).toContain('must be an object');
    });

    it('should reject empty name', () => {
      expect(validateUpdateScenario({ name: '' })).toContain('name must be');
      expect(validateUpdateScenario({ name: '   ' })).toContain('name must be');
    });

    it('should reject name longer than 100 characters', () => {
      const longName = 'a'.repeat(101);
      expect(validateUpdateScenario({ name: longName })).toContain('100 characters');
    });

    it('should reject non-string description', () => {
      expect(validateUpdateScenario({ description: 123 })).toContain('description must be');
    });

    it('should accept null description', () => {
      expect(validateUpdateScenario({ description: null })).toBeNull();
    });

    it('should reject non-array assumption buckets', () => {
      expect(validateUpdateScenario({ assumptionBuckets: 'invalid' })).toContain(
        'must be an array'
      );
    });

    it('should validate assumption buckets', () => {
      const update = {
        assumptionBuckets: [
          {
            id: '1',
            order: 0,
            startAge: 65, // Invalid
            endAge: 30,
            assumptions: {},
          },
        ],
      };
      expect(validateUpdateScenario(update)).toContain('start age');
    });

    it('should validate bucket sequence', () => {
      const update = {
        assumptionBuckets: [
          {
            id: '1',
            order: 0,
            startAge: 30,
            endAge: 64,
            assumptions: {},
          },
          {
            id: '2',
            order: 1,
            startAge: 70, // Gap
            endAge: 95,
            assumptions: {},
          },
        ],
      };
      expect(validateUpdateScenario(update)).toContain('Gap');
    });

    it('should reject non-boolean isDefault', () => {
      expect(validateUpdateScenario({ isDefault: 'true' })).toContain('must be a boolean');
    });
  });

  describe('getBucketForAge', () => {
    const buckets: AssumptionBucket[] = [
      {
        id: '1',
        order: 0,
        startAge: 30,
        endAge: 64,
        assumptions: {
          annualIncome: 100000,
        },
      },
      {
        id: '2',
        order: 1,
        startAge: 65,
        endAge: 95,
        assumptions: {
          annualIncome: 0,
        },
      },
    ];

    it('should return correct bucket for age in first range', () => {
      const bucket = getBucketForAge(buckets, 40);
      expect(bucket).not.toBeNull();
      expect(bucket?.id).toBe('1');
      expect(bucket?.assumptions.annualIncome).toBe(100000);
    });

    it('should return correct bucket for age in second range', () => {
      const bucket = getBucketForAge(buckets, 70);
      expect(bucket).not.toBeNull();
      expect(bucket?.id).toBe('2');
      expect(bucket?.assumptions.annualIncome).toBe(0);
    });

    it('should return correct bucket for age at boundary (start)', () => {
      const bucket = getBucketForAge(buckets, 30);
      expect(bucket).not.toBeNull();
      expect(bucket?.id).toBe('1');
    });

    it('should return correct bucket for age at boundary (end)', () => {
      const bucket = getBucketForAge(buckets, 64);
      expect(bucket).not.toBeNull();
      expect(bucket?.id).toBe('1');
    });

    it('should return null for age before all buckets', () => {
      const bucket = getBucketForAge(buckets, 25);
      expect(bucket).toBeNull();
    });

    it('should return null for age after all buckets', () => {
      const bucket = getBucketForAge(buckets, 100);
      expect(bucket).toBeNull();
    });

    it('should handle unordered buckets correctly', () => {
      const unorderedBuckets: AssumptionBucket[] = [
        {
          id: '2',
          order: 1,
          startAge: 65,
          endAge: 95,
          assumptions: {},
        },
        {
          id: '1',
          order: 0,
          startAge: 30,
          endAge: 64,
          assumptions: {},
        },
      ];

      const bucket = getBucketForAge(unorderedBuckets, 40);
      expect(bucket).not.toBeNull();
      expect(bucket?.id).toBe('1'); // Should still find the correct bucket
    });
  });

  describe('mergeAssumptions', () => {
    it('should return current assumptions when no previous', () => {
      const current: Assumptions = {
        annualIncome: 100000,
        annualSpending: 60000,
      };

      const merged = mergeAssumptions(current);
      expect(merged).toEqual(current);
    });

    it('should use current value when defined', () => {
      const current: Assumptions = {
        annualIncome: 100000,
        annualSpending: 60000,
      };

      const previous: Assumptions = {
        annualIncome: 80000,
        annualSpending: 50000,
      };

      const merged = mergeAssumptions(current, previous);
      expect(merged.annualIncome).toBe(100000);
      expect(merged.annualSpending).toBe(60000);
    });

    it('should use previous value when current is undefined', () => {
      const current: Assumptions = {
        annualIncome: undefined,
        annualSpending: 60000,
      };

      const previous: Assumptions = {
        annualIncome: 80000,
        annualSpending: 50000,
      };

      const merged = mergeAssumptions(current, previous);
      expect(merged.annualIncome).toBe(80000);
      expect(merged.annualSpending).toBe(60000);
    });

    it('should merge contributions correctly', () => {
      const current: Assumptions = {
        contributions: {
          '401k': 20000,
          'roth-ira': undefined,
        },
      };

      const previous: Assumptions = {
        contributions: {
          '401k': 15000,
          'roth-ira': 6500,
          brokerage: 5000,
        },
      };

      const merged = mergeAssumptions(current, previous);
      expect(merged.contributions?.['401k']).toBe(20000);
      expect(merged.contributions?.['roth-ira']).toBe(6500);
      expect(merged.contributions?.['brokerage']).toBe(5000);
    });

    it('should handle missing contributions object', () => {
      const current: Assumptions = {
        annualIncome: 100000,
      };

      const previous: Assumptions = {
        contributions: {
          '401k': 15000,
        },
      };

      const merged = mergeAssumptions(current, previous);
      expect(merged.contributions?.['401k']).toBe(15000);
    });

    it('should handle all undefined current values', () => {
      const current: Assumptions = {};

      const previous: Assumptions = {
        annualIncome: 100000,
        annualSpending: 60000,
        annualTravelBudget: 10000,
        annualHealthcareCosts: 5000,
        contributions: {
          '401k': 20000,
        },
      };

      const merged = mergeAssumptions(current, previous);
      expect(merged.annualIncome).toBe(100000);
      expect(merged.annualSpending).toBe(60000);
      expect(merged.annualTravelBudget).toBe(10000);
      expect(merged.annualHealthcareCosts).toBe(5000);
      expect(merged.contributions?.['401k']).toBe(20000);
    });

    it('should handle zero values correctly', () => {
      const current: Assumptions = {
        annualIncome: 0, // Explicit zero should be used
        annualSpending: 60000,
      };

      const previous: Assumptions = {
        annualIncome: 100000,
        annualSpending: 50000,
      };

      const merged = mergeAssumptions(current, previous);
      expect(merged.annualIncome).toBe(0); // Zero is used, not previous value
      expect(merged.annualSpending).toBe(60000);
    });
  });
});
