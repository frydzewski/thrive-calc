'use client';

import { useSession, signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UserProfile } from './types/profile';
import { Account, calculateAccountSummary, getAccountCategory } from './types/accounts';
import { Scenario } from './types/scenarios';
import OnboardingModal from './components/OnboardingModal';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [defaultScenario, setDefaultScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch profile, accounts, and scenarios in parallel
      const [profileRes, accountsRes, scenariosRes] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/accounts'),
        fetch('/api/scenarios'),
      ]);

      const profileData = await profileRes.json();
      const accountsData = await accountsRes.json();
      const scenariosData = await scenariosRes.json();

      if (profileData.success && profileData.profile) {
        setProfile(profileData.profile);
      }

      if (accountsData.success && accountsData.accounts) {
        setAccounts(accountsData.accounts);
      }

      if (scenariosData.success && scenariosData.scenarios) {
        // Find the default scenario
        const defaultScen = scenariosData.scenarios.find((s: Scenario) => s.isDefault);
        if (defaultScen) {
          setDefaultScenario(defaultScen);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboardingModal(false);
    fetchData(); // Refresh data after onboarding
  };

  if (status === 'loading') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show sign-in CTA for unauthenticated users
  if (!session) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-16">
          <h1 className="text-5xl font-bold text-zinc-900 dark:text-white mb-6">
            Plan Your Financial Future
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-12 max-w-2xl mx-auto">
            Take control of your retirement planning, track your savings goals,
            and manage your investment portfolio all in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => signIn('cognito')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Sign In to Get Started
            </button>
            <Link
              href="/scenarios"
              className="px-6 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              Explore Scenarios
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
              Retirement Planning
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Calculate how much you need to save for a comfortable retirement based on your goals and timeline.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
              Savings Goals
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Set and track multiple savings goals with automated calculations and progress tracking.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-3xl mb-4">💼</div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-white">
              Portfolio Tracking
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400">
              Monitor your investment portfolio performance and asset allocation in real-time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-zinc-600 dark:text-zinc-400">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Check what data is missing
  const hasProfile = profile !== null;
  const hasAccounts = accounts.length > 0;
  const activeAccounts = accounts.filter((a) => a.status === 'active');
  const summary = hasAccounts ? calculateAccountSummary(activeAccounts) : null;

  // Check which account categories are missing
  const hasRetirement = activeAccounts.some((a) => getAccountCategory(a.accountType) === 'retirement');
  const hasInvestment = activeAccounts.some((a) => getAccountCategory(a.accountType) === 'investment');
  const hasCash = activeAccounts.some((a) => getAccountCategory(a.accountType) === 'cash');

  // Case 1: No profile - show primary onboarding CTA
  if (!hasProfile) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="max-w-2xl w-full text-center">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 shadow-lg">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                  <svg
                    className="w-10 h-10 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3">
                  Welcome to ThriveCalc!
                </h1>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
                  Let's get started by setting up your profile and financial accounts.
                  This will take just a few minutes and will help us create a personalized
                  financial plan for you.
                </p>
              </div>

              <button
                onClick={() => setShowOnboardingModal(true)}
                className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Get Started
              </button>

              <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <p className="text-sm text-zinc-500 dark:text-zinc-500 mb-4">
                  We'll help you set up:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-left">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-zinc-600 dark:text-zinc-400">Your personal profile</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-zinc-600 dark:text-zinc-400">Retirement accounts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-zinc-600 dark:text-zinc-400">Investment accounts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-zinc-600 dark:text-zinc-400">Savings & cash accounts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showOnboardingModal && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}
      </div>
    );
  }

  // Case 2: Has profile but missing accounts - show todo cards
  if (!hasAccounts || !hasRetirement || !hasInvestment || !hasCash) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Welcome, {profile.firstname}!
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Let's complete your financial profile to get personalized insights
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {!hasRetirement && (
            <Link href="/accounts">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-200 dark:bg-blue-900 rounded-full">
                    Action Required
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  Add Retirement Accounts
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Add your 401(k), IRA, or other retirement accounts to track your retirement progress
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm">
                  <span>Add accounts</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )}

          {!hasInvestment && (
            <Link href="/accounts">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-lg border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-600">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold text-green-700 dark:text-green-300 bg-green-200 dark:bg-green-900 rounded-full">
                    Action Required
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  Add Investment Accounts
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Add your brokerage and taxable investment accounts to see your complete portfolio
                </p>
                <div className="flex items-center text-green-600 dark:text-green-400 font-medium text-sm">
                  <span>Add accounts</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )}

          {!hasCash && (
            <Link href="/accounts">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-lg border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-600">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </div>
                  <span className="px-2 py-1 text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-200 dark:bg-purple-900 rounded-full">
                    Action Required
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  Add Cash Accounts
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                  Add your savings and checking accounts to track your liquid assets
                </p>
                <div className="flex items-center text-purple-600 dark:text-purple-400 font-medium text-sm">
                  <span>Add accounts</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          )}
        </div>

        {hasAccounts && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
              Current Accounts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${summary?.totalRetirement.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Retirement</div>
              </div>
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${summary?.totalInvestment.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Investment</div>
              </div>
              <div className="text-center p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  ${summary?.totalCash.toLocaleString() || '0'}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">Cash</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Case 3: Has profile and accounts - show full dashboard
  const age = profile.currentAge || 0;
  const retirementAge = 67; // Could be configurable later
  const yearsToRetirement = Math.max(0, retirementAge - age);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
          Financial Dashboard
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Welcome back, {profile.firstname}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Total Net Worth
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            ${summary?.totalNetWorth.toLocaleString()}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            {activeAccounts.length} accounts
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Retirement Savings
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            ${summary?.totalRetirement.toLocaleString()}
          </div>
          <div className="text-sm text-green-600 mt-2">
            {(summary?.byType?.['401k']?.count || 0) + (summary?.byType?.['traditional-ira']?.count || 0) + (summary?.byType?.['roth-ira']?.count || 0)} accounts
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Investment Portfolio
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            ${summary?.totalInvestment.toLocaleString()}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            {summary?.byType?.['brokerage']?.count || 0} accounts
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Years to Retirement
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            {yearsToRetirement}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Age {age} → {retirementAge}
          </div>
        </div>
      </div>

      {/* Retirement Projection Section */}
      {defaultScenario?.projection && (() => {
        const lastYear = defaultScenario.projection.years[defaultScenario.projection.years.length - 1];
        const peakYear = defaultScenario.projection.years.reduce((max, year) =>
          year.accountBalances.total > max.accountBalances.total ? year : max
        );
        const finalNetWorth = defaultScenario.projection.summary.finalNetWorth;
        const firstDeficitYear = defaultScenario.projection.years.find(y => y.netIncome < 0);

        return (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                    Retirement Projection
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                    Based on scenario: {defaultScenario.name}
                  </p>
                </div>
                <Link
                  href="/scenarios"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  View Details
                </Link>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/80 dark:bg-zinc-900/80 p-4 rounded-lg">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Final Balance (Age {lastYear.age})
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                    ${Math.round(finalNetWorth).toLocaleString()}
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/80 p-4 rounded-lg">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Peak Balance
                  </div>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-white">
                    ${Math.round(peakYear.accountBalances.total).toLocaleString()}
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                    At age {peakYear.age}
                  </div>
                </div>

                <div className="bg-white/80 dark:bg-zinc-900/80 p-4 rounded-lg">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    Status
                  </div>
                  <div className={`text-2xl font-bold ${finalNetWorth > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {finalNetWorth > 0 ? 'On Track' : 'At Risk'}
                  </div>
                  {firstDeficitYear && finalNetWorth <= 0 && (
                    <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                      First deficit at age {firstDeficitYear.age}
                    </div>
                  )}
                </div>
              </div>

              {defaultScenario.description && (
                <div className="text-sm text-zinc-600 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/60 p-3 rounded">
                  <span className="font-medium">Scenario Notes:</span> {defaultScenario.description}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Prompt to create scenario if none exists */}
      {!defaultScenario && (
        <div className="mb-8">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-6">
            <div className="flex items-start gap-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-yellow-600 flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                  Create Your Retirement Scenario
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  Start planning your financial future by creating a retirement scenario. Define your income,
                  expenses, and savings goals to see personalized projections.
                </p>
                <Link
                  href="/scenarios"
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  Create Scenario
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Account Breakdown
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-900 dark:text-white">Retirement</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {summary && summary.totalNetWorth > 0
                    ? Math.round((summary.totalRetirement / summary.totalNetWorth) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${summary && summary.totalNetWorth > 0 ? (summary.totalRetirement / summary.totalNetWorth) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-900 dark:text-white">Investment</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {summary && summary.totalNetWorth > 0
                    ? Math.round((summary.totalInvestment / summary.totalNetWorth) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${summary && summary.totalNetWorth > 0 ? (summary.totalInvestment / summary.totalNetWorth) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-900 dark:text-white">Cash</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {summary && summary.totalNetWorth > 0
                    ? Math.round((summary.totalCash / summary.totalNetWorth) * 100)
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{
                    width: `${summary && summary.totalNetWorth > 0 ? (summary.totalCash / summary.totalNetWorth) * 100 : 0}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href="/accounts"
              className="block p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white">
                    Manage Accounts
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Add or update your accounts
                  </div>
                </div>
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/profile"
              className="block p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white">Update Profile</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Manage your personal information
                  </div>
                </div>
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>

            <Link
              href="/scenarios"
              className="block p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white">
                    Financial Scenarios
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Plan your retirement goals
                  </div>
                </div>
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
