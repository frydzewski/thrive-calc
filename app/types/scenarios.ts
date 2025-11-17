import { AccountType } from './accounts';

export interface LumpSumEvent {
  id: string;
  type: 'income' | 'expense';
  age: number;
  amount: number;
  description: string;
}

export interface Assumptions {
  // Retirement
  retirementAge?: number;

  // Income (in TODAY'S dollars - will be inflated)
  annualIncome?: number;
  socialSecurityAge?: number;
  socialSecurityIncome?: number;

  // Account Contributions (in TODAY'S dollars - per account TYPE)
  contributions?: {
    '401k'?: number;
    'traditional-ira'?: number;
    'roth-ira'?: number;
    'brokerage'?: number;
    'savings'?: number;
    'checking'?: number;
  };

  // Spending (in TODAY'S dollars - will be inflated)
  annualSpending?: number;
  annualTravelBudget?: number;
  annualHealthcareCosts?: number;

  // Investment & Inflation (percentages)
  investmentReturnRate?: number; // Same rate for ALL accounts
  inflationRate?: number;
}

export interface AssumptionBucket {
  id: string;
  order: number;
  startAge: number;
  endAge: number;
  assumptions: Assumptions;
}

export interface Scenario {
  id: string;
  username: string;
  name: string;
  isDefault: boolean;
  description?: string;
  assumptionBuckets: AssumptionBucket[];
  lumpSumEvents: LumpSumEvent[];
  /**
   * Calculated financial projection for this scenario
   * Automatically computed when scenario is created or assumptions are updated
   * Stored with scenario to avoid recalculation on every fetch
   */
  projection?: import('./projections').ScenarioProjection;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateScenarioRequest {
  name: string;
  description?: string;
  assumptionBuckets: Omit<AssumptionBucket, 'id'>[];
  lumpSumEvents?: Omit<LumpSumEvent, 'id'>[];
}

export interface UpdateScenarioRequest {
  name?: string;
  description?: string;
  assumptionBuckets?: AssumptionBucket[];
  lumpSumEvents?: LumpSumEvent[];
  isDefault?: boolean;
}

export interface ScenarioResponse {
  success: boolean;
  scenario?: Scenario;
  error?: string;
}

export interface ScenariosListResponse {
  success: boolean;
  scenarios?: Scenario[];
  error?: string;
}

/**
 * Type guard to check if value is a valid LumpSumEvent type
 */
function isValidLumpSumType(type: unknown): type is 'income' | 'expense' {
  return type === 'income' || type === 'expense';
}

/**
 * Validate a lump sum event
 */
export function validateLumpSumEvent(event: unknown): string | null {
  if (!event || typeof event !== 'object' || event === null) {
    return 'Lump sum event must be an object';
  }

  const eventObj = event as Record<string, unknown>;

  if (!eventObj.type || !isValidLumpSumType(eventObj.type)) {
    return 'Lump sum event type must be either "income" or "expense"';
  }

  if (typeof eventObj.age !== 'number' || eventObj.age < 0 || eventObj.age > 120) {
    return 'Lump sum event age must be a number between 0 and 120';
  }

  if (typeof eventObj.amount !== 'number' || eventObj.amount < 0) {
    return 'Lump sum event amount must be a non-negative number';
  }

  if (!eventObj.description || typeof eventObj.description !== 'string' || eventObj.description.trim() === '') {
    return 'Lump sum event description must be a non-empty string';
  }

  return null;
}

/**
 * Type guard to check if value is a valid AccountType
 */
function isValidAccountType(type: string): type is AccountType {
  const validTypes: AccountType[] = ['401k', 'traditional-ira', 'roth-ira', 'brokerage', 'savings', 'checking'];
  return validTypes.includes(type as AccountType);
}

/**
 * Validate assumptions
 */
export function validateAssumptions(assumptions: unknown): string | null {
  if (!assumptions || typeof assumptions !== 'object' || assumptions === null) {
    return 'Assumptions must be an object';
  }

  const assumptionsObj = assumptions as Record<string, unknown>;

  if (assumptionsObj.retirementAge !== undefined) {
    if (typeof assumptionsObj.retirementAge !== 'number' || assumptionsObj.retirementAge < 0 || assumptionsObj.retirementAge > 120) {
      return 'Retirement age must be a number between 0 and 120';
    }
  }

  if (assumptionsObj.annualIncome !== undefined) {
    if (typeof assumptionsObj.annualIncome !== 'number' || assumptionsObj.annualIncome < 0) {
      return 'Annual income must be a non-negative number';
    }
  }

  if (assumptionsObj.socialSecurityAge !== undefined) {
    if (typeof assumptionsObj.socialSecurityAge !== 'number' || assumptionsObj.socialSecurityAge < 0 || assumptionsObj.socialSecurityAge > 120) {
      return 'Social security age must be a number between 0 and 120';
    }
  }

  if (assumptionsObj.socialSecurityIncome !== undefined) {
    if (typeof assumptionsObj.socialSecurityIncome !== 'number' || assumptionsObj.socialSecurityIncome < 0) {
      return 'Social security income must be a non-negative number';
    }
  }

  if (assumptionsObj.annualSpending !== undefined) {
    if (typeof assumptionsObj.annualSpending !== 'number' || assumptionsObj.annualSpending < 0) {
      return 'Annual spending must be a non-negative number';
    }
  }

  if (assumptionsObj.annualTravelBudget !== undefined) {
    if (typeof assumptionsObj.annualTravelBudget !== 'number' || assumptionsObj.annualTravelBudget < 0) {
      return 'Annual travel budget must be a non-negative number';
    }
  }

  if (assumptionsObj.annualHealthcareCosts !== undefined) {
    if (typeof assumptionsObj.annualHealthcareCosts !== 'number' || assumptionsObj.annualHealthcareCosts < 0) {
      return 'Annual healthcare costs must be a non-negative number';
    }
  }

  if (assumptionsObj.investmentReturnRate !== undefined) {
    if (typeof assumptionsObj.investmentReturnRate !== 'number' || assumptionsObj.investmentReturnRate < -100 || assumptionsObj.investmentReturnRate > 100) {
      return 'Investment return rate must be a number between -100 and 100';
    }
  }

  if (assumptionsObj.inflationRate !== undefined) {
    if (typeof assumptionsObj.inflationRate !== 'number' || assumptionsObj.inflationRate < -100 || assumptionsObj.inflationRate > 100) {
      return 'Inflation rate must be a number between -100 and 100';
    }
  }

  if (assumptionsObj.contributions) {
    if (typeof assumptionsObj.contributions !== 'object' || assumptionsObj.contributions === null) {
      return 'Contributions must be an object';
    }

    const contributions = assumptionsObj.contributions as Record<string, unknown>;
    for (const [accountType, contribution] of Object.entries(contributions)) {
      if (!isValidAccountType(accountType)) {
        return `Invalid account type: ${accountType}`;
      }
      if (contribution !== undefined) {
        if (typeof contribution !== 'number' || contribution < 0) {
          return `Contribution for ${accountType} must be a non-negative number`;
        }
      }
    }
  }

  return null;
}

/**
 * Validate an assumption bucket
 */
export function validateAssumptionBucket(bucket: unknown): string | null {
  if (!bucket || typeof bucket !== 'object' || bucket === null) {
    return 'Bucket must be an object';
  }

  const bucketObj = bucket as Record<string, unknown>;

  if (typeof bucketObj.order !== 'number' || bucketObj.order < 0) {
    return 'Bucket order must be a non-negative number';
  }

  if (typeof bucketObj.startAge !== 'number' || bucketObj.startAge < 0 || bucketObj.startAge > 120) {
    return 'Bucket start age must be a number between 0 and 120';
  }

  if (typeof bucketObj.endAge !== 'number' || bucketObj.endAge < 0 || bucketObj.endAge > 999) {
    return 'Bucket end age must be a number between 0 and 999';
  }

  if (bucketObj.startAge > bucketObj.endAge) {
    return 'Bucket start age must be less than or equal to end age';
  }

  if (!bucketObj.assumptions) {
    return 'Bucket must have assumptions';
  }

  const assumptionsError = validateAssumptions(bucketObj.assumptions);
  if (assumptionsError) {
    return assumptionsError;
  }

  return null;
}

/**
 * Validate that assumption buckets have no gaps or overlaps and are in order
 */
export function validateBuckets(buckets: AssumptionBucket[]): string | null {
  if (!buckets || buckets.length === 0) {
    return 'Scenario must have at least one assumption bucket';
  }

  // Sort by order
  const sortedBuckets = [...buckets].sort((a, b) => a.order - b.order);

  // Check that order numbers are sequential
  for (let i = 0; i < sortedBuckets.length; i++) {
    if (sortedBuckets[i].order !== i) {
      return 'Bucket order numbers must be sequential starting from 0';
    }
  }

  // Check for gaps and overlaps
  for (let i = 0; i < sortedBuckets.length - 1; i++) {
    const currentBucket = sortedBuckets[i];
    const nextBucket = sortedBuckets[i + 1];

    if (currentBucket.endAge + 1 !== nextBucket.startAge) {
      if (currentBucket.endAge >= nextBucket.startAge) {
        return `Buckets ${i} and ${i + 1} overlap`;
      } else {
        return `Gap between buckets ${i} and ${i + 1}`;
      }
    }
  }

  return null;
}

/**
 * Validate scenario creation data
 */
export function validateCreateScenario(data: unknown): string | null {
  if (!data || typeof data !== 'object' || data === null) {
    return 'Scenario data must be an object';
  }

  const dataObj = data as Record<string, unknown>;

  if (!dataObj.name || typeof dataObj.name !== 'string' || dataObj.name.trim() === '') {
    return 'Scenario name is required and must be a non-empty string';
  }

  if (dataObj.name.length > 100) {
    return 'Scenario name must be 100 characters or less';
  }

  if (dataObj.description !== undefined && dataObj.description !== null && typeof dataObj.description !== 'string') {
    return 'Scenario description must be a string';
  }

  if (!dataObj.assumptionBuckets || !Array.isArray(dataObj.assumptionBuckets)) {
    return 'Scenario must have assumption buckets array';
  }

  for (const bucket of dataObj.assumptionBuckets) {
    const bucketError = validateAssumptionBucket(bucket);
    if (bucketError) {
      return bucketError;
    }
  }

  // Validate bucket ordering - we can't use validateBuckets directly
  // because IDs haven't been assigned yet, so we do the same validation here
  const buckets = dataObj.assumptionBuckets as unknown[];
  if (buckets.length === 0) {
    return 'Scenario must have at least one assumption bucket';
  }

  // Sort by order
  const sortedBuckets = [...buckets].sort((a: any, b: any) => a.order - b.order);

  // Check that order numbers are sequential
  for (let i = 0; i < sortedBuckets.length; i++) {
    const bucket = sortedBuckets[i] as any;
    if (bucket.order !== i) {
      return 'Bucket order numbers must be sequential starting from 0';
    }
  }

  // Check for gaps and overlaps
  for (let i = 0; i < sortedBuckets.length - 1; i++) {
    const currentBucket = sortedBuckets[i] as any;
    const nextBucket = sortedBuckets[i + 1] as any;

    if (currentBucket.endAge + 1 !== nextBucket.startAge) {
      if (currentBucket.endAge >= nextBucket.startAge) {
        return `Buckets ${i} and ${i + 1} overlap`;
      } else {
        return `Gap between buckets ${i} and ${i + 1}`;
      }
    }
  }

  if (dataObj.lumpSumEvents) {
    if (!Array.isArray(dataObj.lumpSumEvents)) {
      return 'Lump sum events must be an array';
    }

    for (const event of dataObj.lumpSumEvents) {
      const eventError = validateLumpSumEvent(event);
      if (eventError) {
        return eventError;
      }
    }
  }

  return null;
}

/**
 * Validate scenario update data
 */
export function validateUpdateScenario(data: unknown): string | null {
  if (!data || typeof data !== 'object' || data === null) {
    return 'Update data must be an object';
  }

  const dataObj = data as Record<string, unknown>;

  if (dataObj.name !== undefined) {
    if (typeof dataObj.name !== 'string' || dataObj.name.trim() === '') {
      return 'Scenario name must be a non-empty string';
    }
    if (dataObj.name.length > 100) {
      return 'Scenario name must be 100 characters or less';
    }
  }

  if (dataObj.description !== undefined && dataObj.description !== null && typeof dataObj.description !== 'string') {
    return 'Scenario description must be a string';
  }

  if (dataObj.assumptionBuckets !== undefined) {
    if (!Array.isArray(dataObj.assumptionBuckets)) {
      return 'Assumption buckets must be an array';
    }

    for (const bucket of dataObj.assumptionBuckets) {
      const bucketError = validateAssumptionBucket(bucket);
      if (bucketError) {
        return bucketError;
      }
    }

    const bucketsError = validateBuckets(dataObj.assumptionBuckets as AssumptionBucket[]);
    if (bucketsError) {
      return bucketsError;
    }
  }

  if (dataObj.lumpSumEvents !== undefined) {
    if (!Array.isArray(dataObj.lumpSumEvents)) {
      return 'Lump sum events must be an array';
    }

    for (const event of dataObj.lumpSumEvents) {
      const eventError = validateLumpSumEvent(event);
      if (eventError) {
        return eventError;
      }
    }
  }

  if (dataObj.isDefault !== undefined && typeof dataObj.isDefault !== 'boolean') {
    return 'isDefault must be a boolean';
  }

  return null;
}

/**
 * Get the bucket that applies for a given age
 */
export function getBucketForAge(buckets: AssumptionBucket[], age: number): AssumptionBucket | null {
  const sortedBuckets = [...buckets].sort((a, b) => a.order - b.order);

  for (const bucket of sortedBuckets) {
    if (age >= bucket.startAge && age <= bucket.endAge) {
      return bucket;
    }
  }

  return null;
}

/**
 * Merge assumptions: carry forward from previous bucket if not specified
 */
export function mergeAssumptions(current: Assumptions, previous?: Assumptions): Assumptions {
  if (!previous) {
    return current;
  }

  return {
    retirementAge: current.retirementAge ?? previous.retirementAge,
    annualIncome: current.annualIncome ?? previous.annualIncome,
    socialSecurityAge: current.socialSecurityAge ?? previous.socialSecurityAge,
    socialSecurityIncome: current.socialSecurityIncome ?? previous.socialSecurityIncome,
    annualSpending: current.annualSpending ?? previous.annualSpending,
    annualTravelBudget: current.annualTravelBudget ?? previous.annualTravelBudget,
    annualHealthcareCosts: current.annualHealthcareCosts ?? previous.annualHealthcareCosts,
    investmentReturnRate: current.investmentReturnRate ?? previous.investmentReturnRate,
    inflationRate: current.inflationRate ?? previous.inflationRate,
    contributions: {
      '401k': current.contributions?.['401k'] ?? previous.contributions?.['401k'],
      'traditional-ira': current.contributions?.['traditional-ira'] ?? previous.contributions?.['traditional-ira'],
      'roth-ira': current.contributions?.['roth-ira'] ?? previous.contributions?.['roth-ira'],
      'brokerage': current.contributions?.['brokerage'] ?? previous.contributions?.['brokerage'],
      'savings': current.contributions?.['savings'] ?? previous.contributions?.['savings'],
      'checking': current.contributions?.['checking'] ?? previous.contributions?.['checking'],
    },
  };
}
