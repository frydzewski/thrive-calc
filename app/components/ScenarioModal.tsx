'use client';

import { useState, useEffect } from 'react';
import {
  Scenario,
  AssumptionBucket,
  LumpSumEvent,
  Assumptions,
  CreateScenarioRequest
} from '../types/scenarios';
import { AccountType } from '../types/accounts';
import { Mortgage } from '../types/mortgages';

interface ScenarioModalProps {
  scenario: Scenario | null;
  onClose: (saved: boolean) => void;
}

interface LumpSumEventForm extends Omit<LumpSumEvent, 'id'> {
  tempId: string;
}

interface AssumptionBucketForm extends Omit<AssumptionBucket, 'id'> {
  tempId: string;
}

interface MortgageForm extends Omit<Mortgage, 'id'> {
  tempId: string;
}

export default function ScenarioModal({ scenario, onClose }: ScenarioModalProps) {
  const isEditing = scenario !== null;

  const [name, setName] = useState(scenario?.name || '');
  const [description, setDescription] = useState(scenario?.description || '');
  const [retirementAge, setRetirementAge] = useState<number | undefined>(scenario?.retirementAge);
  const [socialSecurityAge, setSocialSecurityAge] = useState<number | undefined>(scenario?.socialSecurityAge);
  const [socialSecurityIncome, setSocialSecurityIncome] = useState<number | undefined>(scenario?.socialSecurityIncome);
  const [investmentReturnRate, setInvestmentReturnRate] = useState<number | undefined>(scenario?.investmentReturnRate ?? 7);
  const [inflationRate, setInflationRate] = useState<number | undefined>(scenario?.inflationRate ?? 2.5);
  const [buckets, setBuckets] = useState<AssumptionBucketForm[]>([]);
  const [lumpSumEvents, setLumpSumEvents] = useState<LumpSumEventForm[]>([]);
  const [mortgages, setMortgages] = useState<MortgageForm[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize buckets, events, and mortgages from scenario
  useEffect(() => {
    if (scenario) {
      setBuckets(
        scenario.assumptionBuckets.map((bucket) => ({
          ...bucket,
          tempId: bucket.id,
        }))
      );
      setLumpSumEvents(
        scenario.lumpSumEvents.map((event) => ({
          ...event,
          tempId: event.id,
        }))
      );
      setMortgages(
        (scenario.mortgages || []).map((mortgage) => ({
          ...mortgage,
          tempId: mortgage.id,
        }))
      );
    } else {
      // Default: one bucket from age 30 to 100
      setBuckets([
        {
          tempId: crypto.randomUUID(),
          order: 0,
          startAge: 30,
          endAge: 100,
          assumptions: {
            annualIncome: 0,
            annualSpending: 0,
          },
        },
      ]);
      setLumpSumEvents([]);
      setMortgages([]);
    }
  }, [scenario]);

  const accountTypes: AccountType[] = [
    '401k',
    'traditional-ira',
    'roth-ira',
    'brokerage',
    'savings',
    'checking',
  ];

  const getAccountTypeLabel = (type: AccountType): string => {
    const labels: Record<AccountType, string> = {
      '401k': '401(k)',
      'traditional-ira': 'Traditional IRA',
      'roth-ira': 'Roth IRA',
      brokerage: 'Brokerage',
      savings: 'Savings',
      checking: 'Checking',
    };
    return labels[type];
  };

  // Add a new assumption bucket
  const handleAddBucket = () => {
    const lastBucket = buckets[buckets.length - 1];
    const newStartAge = lastBucket ? lastBucket.endAge + 1 : 30;

    setBuckets([
      ...buckets,
      {
        tempId: crypto.randomUUID(),
        order: buckets.length,
        startAge: newStartAge,
        endAge: newStartAge + 10,
        assumptions: lastBucket
          ? { ...lastBucket.assumptions }
          : {
              annualIncome: 0,
              annualSpending: 0,
            },
      },
    ]);
  };

  // Remove a bucket
  const handleRemoveBucket = (tempId: string) => {
    if (buckets.length === 1) {
      setError('You must have at least one assumption bucket');
      return;
    }
    const newBuckets = buckets.filter((b) => b.tempId !== tempId);
    // Re-order
    newBuckets.forEach((bucket, index) => {
      bucket.order = index;
    });
    setBuckets(newBuckets);
  };

  // Update bucket field
  const updateBucket = (tempId: string, field: keyof AssumptionBucketForm, value: any) => {
    setBuckets(
      buckets.map((bucket) =>
        bucket.tempId === tempId ? { ...bucket, [field]: value } : bucket
      )
    );
  };

  // Update assumption within a bucket
  const updateAssumption = (
    tempId: string,
    field: keyof Assumptions | string,
    value: any
  ) => {
    setBuckets(
      buckets.map((bucket) => {
        if (bucket.tempId !== tempId) return bucket;

        // Handle nested contributions
        if (field.startsWith('contributions.')) {
          const accountType = field.split('.')[1] as AccountType;
          return {
            ...bucket,
            assumptions: {
              ...bucket.assumptions,
              contributions: {
                ...bucket.assumptions.contributions,
                [accountType]: value === '' ? undefined : Number(value),
              },
            },
          };
        }

        return {
          ...bucket,
          assumptions: {
            ...bucket.assumptions,
            [field]: value === '' ? undefined : Number(value),
          },
        };
      })
    );
  };

  // Add lump sum event
  const handleAddLumpSumEvent = () => {
    setLumpSumEvents([
      ...lumpSumEvents,
      {
        tempId: crypto.randomUUID(),
        type: 'income',
        age: 65,
        amount: 0,
        description: '',
      },
    ]);
  };

  // Remove lump sum event
  const handleRemoveLumpSumEvent = (tempId: string) => {
    setLumpSumEvents(lumpSumEvents.filter((e) => e.tempId !== tempId));
  };

  // Update lump sum event field
  const updateLumpSumEvent = (
    tempId: string,
    field: keyof Omit<LumpSumEvent, 'id'>,
    value: any
  ) => {
    setLumpSumEvents(
      lumpSumEvents.map((event) =>
        event.tempId === tempId ? { ...event, [field]: value } : event
      )
    );
  };

  // Add mortgage
  const handleAddMortgage = () => {
    const currentYear = new Date().getFullYear();
    setMortgages([
      ...mortgages,
      {
        tempId: crypto.randomUUID(),
        name: '',
        startDate: `${currentYear}-01-01`,
        loanAmount: 0,
        termYears: 30,
        interestRate: 0,
        monthlyEscrow: 0,
        additionalMonthlyPayment: 0,
        description: '',
      },
    ]);
  };

  // Remove mortgage
  const handleRemoveMortgage = (tempId: string) => {
    setMortgages(mortgages.filter((m) => m.tempId !== tempId));
  };

  // Update mortgage field
  const updateMortgage = (
    tempId: string,
    field: keyof Omit<Mortgage, 'id'>,
    value: any
  ) => {
    setMortgages(
      mortgages.map((mortgage) =>
        mortgage.tempId === tempId ? { ...mortgage, [field]: value } : mortgage
      )
    );
  };

  const validateForm = (): string | null => {
    if (!name.trim()) {
      return 'Scenario name is required';
    }

    if (buckets.length === 0) {
      return 'At least one assumption bucket is required';
    }

    // Validate bucket ages
    for (let i = 0; i < buckets.length; i++) {
      const bucket = buckets[i];
      if (bucket.startAge >= bucket.endAge) {
        return `Bucket ${i + 1}: Start age must be less than end age`;
      }
      if (i > 0 && buckets[i - 1].endAge + 1 !== bucket.startAge) {
        return `Bucket ${i + 1}: Must start at age ${buckets[i - 1].endAge + 1} (no gaps or overlaps)`;
      }
    }

    // Validate lump sum events
    for (let i = 0; i < lumpSumEvents.length; i++) {
      const event = lumpSumEvents[i];
      if (!event.description.trim()) {
        return `Lump sum event ${i + 1}: Description is required`;
      }
      if (event.amount <= 0) {
        return `Lump sum event ${i + 1}: Amount must be greater than 0`;
      }
    }

    // Validate mortgages
    for (let i = 0; i < mortgages.length; i++) {
      const mortgage = mortgages[i];
      if (!mortgage.name.trim()) {
        return `Mortgage ${i + 1}: Name is required`;
      }
      if (mortgage.loanAmount <= 0) {
        return `Mortgage ${i + 1}: Loan amount must be greater than 0`;
      }
      if (mortgage.interestRate < 0) {
        return `Mortgage ${i + 1}: Interest rate must be non-negative`;
      }
      if (mortgage.termYears <= 0) {
        return `Mortgage ${i + 1}: Term must be greater than 0`;
      }
      if (mortgage.monthlyEscrow < 0) {
        return `Mortgage ${i + 1}: Monthly escrow must be non-negative`;
      }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const url = isEditing ? `/api/scenarios/${scenario.id}` : '/api/scenarios';
      const method = isEditing ? 'PUT' : 'POST';

      const body: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        retirementAge,
        socialSecurityAge,
        socialSecurityIncome,
        investmentReturnRate,
        inflationRate,
        assumptionBuckets: buckets.map(({ tempId, ...bucket }) => bucket),
        lumpSumEvents: lumpSumEvents.map(({ tempId, ...event }) => event),
        mortgages: mortgages.map(({ tempId, ...mortgage }) => mortgage),
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to save scenario');
      }

      onClose(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save scenario');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-zinc-900 p-6 border-b border-zinc-200 dark:border-zinc-800 z-10">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {isEditing ? 'Edit Scenario' : 'Create New Scenario'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Basic Information
            </h3>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Scenario Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
                placeholder="e.g., Base Case, Aggressive Savings, Early Retirement"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
                placeholder="Optional description of this scenario..."
                rows={3}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Scenario Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Scenario Settings
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              These settings apply to the entire scenario
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Retirement Age
                </label>
                <input
                  type="number"
                  value={retirementAge ?? ''}
                  onChange={(e) => setRetirementAge(e.target.value === '' ? undefined : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
                  min="0"
                  max="120"
                  placeholder="65"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Social Security Age
                </label>
                <input
                  type="number"
                  value={socialSecurityAge ?? ''}
                  onChange={(e) => setSocialSecurityAge(e.target.value === '' ? undefined : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
                  min="0"
                  max="120"
                  placeholder="67"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Social Security Income ($)
                </label>
                <input
                  type="number"
                  value={socialSecurityIncome ?? ''}
                  onChange={(e) => setSocialSecurityIncome(e.target.value === '' ? undefined : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
                  min="0"
                  placeholder="0"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Investment Return Rate (%)
                </label>
                <input
                  type="number"
                  value={investmentReturnRate ?? ''}
                  onChange={(e) => setInvestmentReturnRate(e.target.value === '' ? undefined : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
                  min="-100"
                  max="100"
                  step="0.1"
                  placeholder="7.0"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Inflation Rate (%)
                </label>
                <input
                  type="number"
                  value={inflationRate ?? ''}
                  onChange={(e) => setInflationRate(e.target.value === '' ? undefined : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
                  min="-100"
                  max="100"
                  step="0.1"
                  placeholder="2.5"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Assumption Buckets */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Assumption Buckets
              </h3>
              <button
                type="button"
                onClick={handleAddBucket}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
              >
                + Add Another Bucket
              </button>
            </div>

            <div className="space-y-6">
              {buckets.map((bucket, index) => (
                <div
                  key={bucket.tempId}
                  className="p-6 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 space-y-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-semibold text-zinc-900 dark:text-white">
                      Bucket {index + 1}: Ages {bucket.startAge} - {bucket.endAge}
                    </h4>
                    {buckets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveBucket(bucket.tempId)}
                        disabled={isLoading}
                        className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Age Range */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Start Age *
                      </label>
                      <input
                        type="number"
                        value={bucket.startAge}
                        onChange={(e) =>
                          updateBucket(bucket.tempId, 'startAge', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white dark:bg-zinc-800"
                        min="0"
                        max="120"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        End Age *
                      </label>
                      <input
                        type="number"
                        value={bucket.endAge}
                        onChange={(e) =>
                          updateBucket(bucket.tempId, 'endAge', Number(e.target.value))
                        }
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white dark:bg-zinc-800"
                        min="0"
                        max="999"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  {/* Income */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                      Annual Income ($)
                    </label>
                    <input
                      type="number"
                      value={bucket.assumptions.annualIncome ?? ''}
                      onChange={(e) =>
                        updateAssumption(bucket.tempId, 'annualIncome', e.target.value)
                      }
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white dark:bg-zinc-800"
                      min="0"
                      placeholder="0"
                      disabled={isLoading}
                    />
                  </div>

                  {/* Spending */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Annual Spending ($)
                      </label>
                      <input
                        type="number"
                        value={bucket.assumptions.annualSpending ?? ''}
                        onChange={(e) =>
                          updateAssumption(bucket.tempId, 'annualSpending', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white dark:bg-zinc-800"
                        min="0"
                        placeholder="0"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Travel Budget ($)
                      </label>
                      <input
                        type="number"
                        value={bucket.assumptions.annualTravelBudget ?? ''}
                        onChange={(e) =>
                          updateAssumption(bucket.tempId, 'annualTravelBudget', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white dark:bg-zinc-800"
                        min="0"
                        placeholder="0"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                        Healthcare Costs ($)
                      </label>
                      <input
                        type="number"
                        value={bucket.assumptions.annualHealthcareCosts ?? ''}
                        onChange={(e) =>
                          updateAssumption(bucket.tempId, 'annualHealthcareCosts', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white dark:bg-zinc-800"
                        min="0"
                        placeholder="0"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Contributions */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
                      Annual Contributions by Account Type ($)
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {accountTypes.map((accountType) => (
                        <div key={accountType}>
                          <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                            {getAccountTypeLabel(accountType)}
                          </label>
                          <input
                            type="number"
                            value={bucket.assumptions.contributions?.[accountType] ?? ''}
                            onChange={(e) =>
                              updateAssumption(
                                bucket.tempId,
                                `contributions.${accountType}`,
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                            min="0"
                            placeholder="0"
                            disabled={isLoading}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lump Sum Events */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Lump Sum Events
              </h3>
              <button
                type="button"
                onClick={handleAddLumpSumEvent}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
              >
                + Add Event
              </button>
            </div>

            {lumpSumEvents.length > 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Age
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
                    {lumpSumEvents.map((event) => (
                      <tr key={event.tempId}>
                        <td className="px-4 py-3">
                          <select
                            value={event.type}
                            onChange={(e) =>
                              updateLumpSumEvent(
                                event.tempId,
                                'type',
                                e.target.value as 'income' | 'expense'
                              )
                            }
                            className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                            disabled={isLoading}
                          >
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={event.age}
                            onChange={(e) =>
                              updateLumpSumEvent(event.tempId, 'age', Number(e.target.value))
                            }
                            className="w-20 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                            min="0"
                            max="120"
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-zinc-500 dark:text-zinc-400 mr-1">$</span>
                            <input
                              type="number"
                              value={event.amount}
                              onChange={(e) =>
                                updateLumpSumEvent(event.tempId, 'amount', Number(e.target.value))
                              }
                              className="w-32 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                              min="0"
                              disabled={isLoading}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={event.description}
                            onChange={(e) =>
                              updateLumpSumEvent(event.tempId, 'description', e.target.value)
                            }
                            className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                            placeholder="e.g., Home purchase, inheritance"
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveLumpSumEvent(event.tempId)}
                            disabled={isLoading}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                No lump sum events. Click "Add Event" to add one-time income or expenses.
              </p>
            )}
          </div>

          {/* Mortgages */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Mortgages
              </h3>
              <button
                type="button"
                onClick={handleAddMortgage}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
              >
                + Add Mortgage
              </button>
            </div>

            {mortgages.length > 0 ? (
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Loan Amount
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Rate (%)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Term (Yrs)
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Start Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Escrow
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-zinc-600 dark:text-zinc-400 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 bg-white dark:bg-zinc-900">
                    {mortgages.map((mortgage) => (
                      <tr key={mortgage.tempId}>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={mortgage.name}
                            onChange={(e) =>
                              updateMortgage(mortgage.tempId, 'name', e.target.value)
                            }
                            className="w-full px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                            placeholder="e.g., Primary Home"
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-zinc-500 dark:text-zinc-400 mr-1">$</span>
                            <input
                              type="number"
                              value={mortgage.loanAmount}
                              onChange={(e) =>
                                updateMortgage(mortgage.tempId, 'loanAmount', Number(e.target.value))
                              }
                              className="w-32 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                              min="0"
                              disabled={isLoading}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={mortgage.interestRate}
                            onChange={(e) =>
                              updateMortgage(mortgage.tempId, 'interestRate', Number(e.target.value))
                            }
                            className="w-20 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                            min="0"
                            max="30"
                            step="0.1"
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={mortgage.termYears}
                            onChange={(e) =>
                              updateMortgage(mortgage.tempId, 'termYears', Number(e.target.value))
                            }
                            className="w-16 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                            min="1"
                            max="50"
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="date"
                            value={mortgage.startDate}
                            onChange={(e) =>
                              updateMortgage(mortgage.tempId, 'startDate', e.target.value)
                            }
                            className="w-36 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                            disabled={isLoading}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <span className="text-zinc-500 dark:text-zinc-400 mr-1">$</span>
                            <input
                              type="number"
                              value={mortgage.monthlyEscrow}
                              onChange={(e) =>
                                updateMortgage(mortgage.tempId, 'monthlyEscrow', Number(e.target.value))
                              }
                              className="w-24 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-900 dark:text-white dark:bg-zinc-800 text-sm"
                              min="0"
                              disabled={isLoading}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleRemoveMortgage(mortgage.tempId)}
                            disabled={isLoading}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 italic">
                No mortgages. Click "Add Mortgage" to include mortgage payments in your projection.
              </p>
            )}
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="px-6 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
