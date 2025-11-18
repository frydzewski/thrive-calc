/**
 * Scenario Details Page
 *
 * Displays a comprehensive year-by-year financial projection for a scenario, including:
 * - Summary metrics (final balance, peak balance, status, projection period)
 * - Detailed annual breakdown of income, spending, contributions, and account balances
 * - Visual indicators for deficit years
 * - Overall projection summary statistics
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Scenario } from '../../types/scenarios';
import { AnnualProjection } from '../../types/projections';

export default function ScenarioDetails() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scenarioId = params.id as string;

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  const fetchScenario = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/scenarios/${scenarioId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch scenario');
      }

      const data = await response.json();
      if (data.success) {
        setScenario(data.scenario);
      } else {
        throw new Error(data.error || 'Failed to fetch scenario');
      }
    } catch (err) {
      console.error('Error fetching scenario:', err);
      setError('Failed to load scenario details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [scenarioId]);

  // Fetch scenario details when authenticated
  useEffect(() => {
    if (status === 'authenticated' && scenarioId) {
      fetchScenario();
    }
  }, [status, scenarioId, fetchScenario]);

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-zinc-600 dark:text-zinc-400">Loading scenario...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !scenario) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/scenarios"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Scenarios
          </Link>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <p className="text-red-800 dark:text-red-200">
            {error || 'Scenario not found'}
          </p>
        </div>
      </div>
    );
  }

  // No projection available
  if (!scenario.projection) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/scenarios"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Scenarios
          </Link>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            {scenario.name}
          </h2>
          <p className="text-yellow-800 dark:text-yellow-200">
            No projection available for this scenario. Projections are calculated automatically
            when scenarios are created or edited.
          </p>
        </div>
      </div>
    );
  }

  const { projection } = scenario;
  const lastYear = projection.years[projection.years.length - 1];
  const peakYear = projection.years.reduce((max, year) =>
    year.accountBalances.total > max.accountBalances.total ? year : max
  );
  const finalNetWorth = projection.summary.finalNetWorth;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/scenarios"
          className="text-blue-600 dark:text-blue-400 hover:underline mb-4 inline-block"
        >
          ← Back to Scenarios
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
                {scenario.name}
              </h1>
              {scenario.isDefault && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Default Scenario
                </span>
              )}
            </div>
            {scenario.description && (
              <p className="text-zinc-600 dark:text-zinc-400">{scenario.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Final Balance</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            ${Math.round(finalNetWorth).toLocaleString()}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
            at age {lastYear.age}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Peak Balance</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            ${Math.round(peakYear.accountBalances.total).toLocaleString()}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
            at age {peakYear.age}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Status</div>
          <div className={`text-2xl font-bold ${finalNetWorth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {finalNetWorth > 0 ? 'On Track' : 'At Risk'}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
            {projection.summary.yearsInDeficit} year(s) in deficit
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">Projection Period</div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            {projection.years.length}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
            years ({projection.summary.startYear} - {projection.summary.endYear})
          </div>
        </div>
      </div>

      {/* Account Balances by Category */}
      <div className="mb-8 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Account Balances
          </h2>
        </div>
        <div className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Retirement Accounts */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Retirement
              </h3>
              <div className="space-y-3">
                {['401k', 'traditional-ira', 'roth-ira'].map((accountType) => {
                  const firstYear = projection.years[0];
                  const lastYear = projection.years[projection.years.length - 1];
                  const startBalance = firstYear.accountBalances.byAccountType[accountType as keyof typeof firstYear.accountBalances.byAccountType] || 0;
                  const endBalance = lastYear.accountBalances.byAccountType[accountType as keyof typeof lastYear.accountBalances.byAccountType] || 0;
                  const change = endBalance - startBalance;
                  const changePercent = startBalance > 0 ? (change / startBalance) * 100 : 0;

                  if (startBalance === 0 && endBalance === 0) return null;

                  return (
                    <div key={accountType} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        {accountType === '401k' ? '401(k)' : 
                         accountType === 'traditional-ira' ? 'Traditional IRA' : 
                         'Roth IRA'}
                      </div>
                      <div className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                        ${Math.round(endBalance).toLocaleString()}
                      </div>
                      <div className={`text-xs flex items-center ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {change >= 0 ? (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        ${Math.abs(Math.round(change)).toLocaleString()} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Investment Accounts */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Investment
              </h3>
              <div className="space-y-3">
                {['brokerage'].map((accountType) => {
                  const firstYear = projection.years[0];
                  const lastYear = projection.years[projection.years.length - 1];
                  const startBalance = firstYear.accountBalances.byAccountType[accountType as keyof typeof firstYear.accountBalances.byAccountType] || 0;
                  const endBalance = lastYear.accountBalances.byAccountType[accountType as keyof typeof lastYear.accountBalances.byAccountType] || 0;
                  const change = endBalance - startBalance;
                  const changePercent = startBalance > 0 ? (change / startBalance) * 100 : 0;

                  if (startBalance === 0 && endBalance === 0) return null;

                  return (
                    <div key={accountType} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        Brokerage
                      </div>
                      <div className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                        ${Math.round(endBalance).toLocaleString()}
                      </div>
                      <div className={`text-xs flex items-center ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {change >= 0 ? (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        ${Math.abs(Math.round(change)).toLocaleString()} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cash Accounts */}
            <div>
              <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Cash
              </h3>
              <div className="space-y-3">
                {['checking', 'savings'].map((accountType) => {
                  const firstYear = projection.years[0];
                  const lastYear = projection.years[projection.years.length - 1];
                  const startBalance = firstYear.accountBalances.byAccountType[accountType as keyof typeof firstYear.accountBalances.byAccountType] || 0;
                  const endBalance = lastYear.accountBalances.byAccountType[accountType as keyof typeof lastYear.accountBalances.byAccountType] || 0;
                  const change = endBalance - startBalance;
                  const changePercent = startBalance > 0 ? (change / startBalance) * 100 : 0;

                  if (startBalance === 0 && endBalance === 0) return null;

                  return (
                    <div key={accountType} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-3">
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        {accountType === 'checking' ? 'Checking' : 'Savings'}
                      </div>
                      <div className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                        ${Math.round(endBalance).toLocaleString()}
                      </div>
                      <div className={`text-xs flex items-center ${change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {change >= 0 ? (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        ${Math.abs(Math.round(change)).toLocaleString()} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-Year Projection Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Year-by-Year Projection
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Age
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Total Income
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Total Spending
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Contributions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Income After Contributions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Net Income
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Retirement
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Investment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Cash
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Total Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {projection.years.map((year: AnnualProjection, index: number) => {
                // Calculate category balances
                const retirementBalance = 
                  (year.accountBalances.byAccountType['401k'] || 0) +
                  (year.accountBalances.byAccountType['traditional-ira'] || 0) +
                  (year.accountBalances.byAccountType['roth-ira'] || 0);
                
                const investmentBalance = year.accountBalances.byAccountType['brokerage'] || 0;
                
                const cashBalance = 
                  (year.accountBalances.byAccountType['checking'] || 0) +
                  (year.accountBalances.byAccountType['savings'] || 0);

                // Calculate changes from previous year
                let retirementChange = 0;
                let investmentChange = 0;
                let cashChange = 0;

                if (index > 0) {
                  const prevYear = projection.years[index - 1];
                  const prevRetirement = 
                    (prevYear.accountBalances.byAccountType['401k'] || 0) +
                    (prevYear.accountBalances.byAccountType['traditional-ira'] || 0) +
                    (prevYear.accountBalances.byAccountType['roth-ira'] || 0);
                  const prevInvestment = prevYear.accountBalances.byAccountType['brokerage'] || 0;
                  const prevCash = 
                    (prevYear.accountBalances.byAccountType['checking'] || 0) +
                    (prevYear.accountBalances.byAccountType['savings'] || 0);

                  retirementChange = retirementBalance - prevRetirement;
                  investmentChange = investmentBalance - prevInvestment;
                  cashChange = cashBalance - prevCash;
                }

                return (
                  <tr
                    key={year.year}
                    className={year.netIncome < 0 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-900 dark:text-white font-medium">
                      {year.year}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                      {year.age}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-zinc-900 dark:text-white">
                      ${Math.round(year.income.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-zinc-900 dark:text-white">
                      ${Math.round(year.spending.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-zinc-900 dark:text-white">
                      ${Math.round(year.contributions.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-zinc-900 dark:text-white font-medium">
                      ${Math.round(year.incomeAfterContributions).toLocaleString()}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${year.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      ${Math.round(year.netIncome).toLocaleString()}
                    </td>
                    
                    {/* Retirement Balance */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-zinc-900 dark:text-white">
                        ${Math.round(retirementBalance).toLocaleString()}
                      </div>
                      {index > 0 && (
                        <div className={`text-xs ${retirementChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {retirementChange >= 0 ? '+' : ''}{Math.round(retirementChange).toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Investment Balance */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-zinc-900 dark:text-white">
                        ${Math.round(investmentBalance).toLocaleString()}
                      </div>
                      {index > 0 && (
                        <div className={`text-xs ${investmentChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {investmentChange >= 0 ? '+' : ''}{Math.round(investmentChange).toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Cash Balance */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-zinc-900 dark:text-white">
                        ${Math.round(cashBalance).toLocaleString()}
                      </div>
                      {index > 0 && (
                        <div className={`text-xs ${cashChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {cashChange >= 0 ? '+' : ''}{Math.round(cashChange).toLocaleString()}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right text-zinc-900 dark:text-white font-semibold">
                      ${Math.round(year.accountBalances.total).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Projection Summary */}
      <div className="mt-8 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Projection Summary
        </h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-zinc-600 dark:text-zinc-400">Total Income:</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                ${Math.round(projection.summary.totalIncome).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-zinc-600 dark:text-zinc-400">Total Spending:</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                ${Math.round(projection.summary.totalSpending).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-zinc-600 dark:text-zinc-400">Total Contributions:</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                ${Math.round(projection.summary.totalContributions).toLocaleString()}
              </span>
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-zinc-600 dark:text-zinc-400">Years in Deficit:</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {projection.summary.yearsInDeficit}
              </span>
            </div>
            {projection.summary.firstDeficitYear && (
              <div className="flex justify-between mb-2">
                <span className="text-zinc-600 dark:text-zinc-400">First Deficit Year:</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {projection.summary.firstDeficitYear}
                </span>
              </div>
            )}
            <div className="flex justify-between mb-2">
              <span className="text-zinc-600 dark:text-zinc-400">Final Net Worth:</span>
              <span className={`font-semibold ${finalNetWorth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ${Math.round(finalNetWorth).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
