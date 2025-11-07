'use client';

import { useState } from 'react';

export default function RetirementCalculator() {
  const [currentAge, setCurrentAge] = useState(35);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentSavings, setCurrentSavings] = useState(50000);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [expectedReturn, setExpectedReturn] = useState(7);
  const [yearsInRetirement, setYearsInRetirement] = useState(25);

  const calculateRetirement = () => {
    const yearsToRetirement = retirementAge - currentAge;
    const monthlyRate = expectedReturn / 100 / 12;
    const months = yearsToRetirement * 12;

    // Future value of current savings
    const futureValueOfSavings = currentSavings * Math.pow(1 + monthlyRate, months);

    // Future value of monthly contributions
    const futureValueOfContributions = monthlyContribution *
      ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);

    const totalAtRetirement = futureValueOfSavings + futureValueOfContributions;

    // Monthly income in retirement (simplified)
    const monthlyRetirementIncome = totalAtRetirement / (yearsInRetirement * 12);

    return {
      totalAtRetirement,
      monthlyRetirementIncome,
      yearsToRetirement
    };
  };

  const results = calculateRetirement();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
        Retirement Calculator
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">
            Your Information
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Current Age: {currentAge}
              </label>
              <input
                type="range"
                min="18"
                max="80"
                value={currentAge}
                onChange={(e) => setCurrentAge(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Retirement Age: {retirementAge}
              </label>
              <input
                type="range"
                min="50"
                max="80"
                value={retirementAge}
                onChange={(e) => setRetirementAge(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Current Savings: ${currentSavings.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="500000"
                step="5000"
                value={currentSavings}
                onChange={(e) => setCurrentSavings(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Monthly Contribution: ${monthlyContribution.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Expected Annual Return: {expectedReturn}%
              </label>
              <input
                type="range"
                min="0"
                max="15"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Years in Retirement: {yearsInRetirement}
              </label>
              <input
                type="range"
                min="10"
                max="40"
                value={yearsInRetirement}
                onChange={(e) => setYearsInRetirement(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">
            Projection
          </h2>

          <div className="space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Total at Retirement
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                ${results.totalAtRetirement.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                Monthly Income in Retirement
              </div>
              <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                ${results.monthlyRetirementIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                per month for {yearsInRetirement} years
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Years to Retirement</span>
                  <span className="font-medium text-zinc-900 dark:text-white">{results.yearsToRetirement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Total Contributions</span>
                  <span className="font-medium text-zinc-900 dark:text-white">
                    ${(monthlyContribution * results.yearsToRetirement * 12).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Investment Growth</span>
                  <span className="font-medium text-green-600">
                    ${(results.totalAtRetirement - currentSavings - (monthlyContribution * results.yearsToRetirement * 12)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          <strong>Disclaimer:</strong> This calculator provides estimates based on the inputs you provide and assumes a constant rate of return.
          Actual investment returns vary and are not guaranteed. This tool is for educational purposes only and should not be considered financial advice.
        </p>
      </div>
    </div>
  );
}
