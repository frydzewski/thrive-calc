'use client';

import { useState } from 'react';

interface Holding {
  id: number;
  symbol: string;
  name: string;
  shares: number;
  purchasePrice: number;
  currentPrice: number;
}

export default function Portfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([
    {
      id: 1,
      symbol: 'VTI',
      name: 'Vanguard Total Stock Market ETF',
      shares: 100,
      purchasePrice: 200,
      currentPrice: 235
    },
    {
      id: 2,
      symbol: 'BND',
      name: 'Vanguard Total Bond Market ETF',
      shares: 150,
      purchasePrice: 78,
      currentPrice: 75
    },
    {
      id: 3,
      symbol: 'VEA',
      name: 'Vanguard FTSE Developed Markets ETF',
      shares: 80,
      purchasePrice: 45,
      currentPrice: 52
    }
  ]);

  const calculateValue = (holding: Holding) => {
    return holding.shares * holding.currentPrice;
  };

  const calculateGainLoss = (holding: Holding) => {
    const currentValue = calculateValue(holding);
    const costBasis = holding.shares * holding.purchasePrice;
    return currentValue - costBasis;
  };

  const calculateGainLossPercentage = (holding: Holding) => {
    const gainLoss = calculateGainLoss(holding);
    const costBasis = holding.shares * holding.purchasePrice;
    return (gainLoss / costBasis) * 100;
  };

  const totalPortfolioValue = holdings.reduce((sum, holding) => sum + calculateValue(holding), 0);
  const totalCostBasis = holdings.reduce((sum, holding) => sum + (holding.shares * holding.purchasePrice), 0);
  const totalGainLoss = totalPortfolioValue - totalCostBasis;
  const totalGainLossPercentage = (totalGainLoss / totalCostBasis) * 100;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
        Investment Portfolio
      </h1>

      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Total Value
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Cost Basis
          </div>
          <div className="text-2xl font-bold text-zinc-900 dark:text-white">
            ${totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Total Gain/Loss
          </div>
          <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Total Return
          </div>
          <div className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercentage.toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Avg Cost
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Market Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Gain/Loss
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Return
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  % of Portfolio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
              {holdings.map((holding) => {
                const value = calculateValue(holding);
                const gainLoss = calculateGainLoss(holding);
                const gainLossPercentage = calculateGainLossPercentage(holding);
                const portfolioPercentage = (value / totalPortfolioValue) * 100;

                return (
                  <tr key={holding.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {holding.symbol}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">
                        {holding.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-zinc-900 dark:text-white">
                      {holding.shares}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-zinc-900 dark:text-white">
                      ${holding.purchasePrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-zinc-900 dark:text-white">
                      ${holding.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-zinc-900 dark:text-white">
                      ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gainLoss >= 0 ? '+' : ''}${gainLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {gainLoss >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-zinc-900 dark:text-white">
                      {portfolioPercentage.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Asset Allocation
          </h2>
          <div className="space-y-4">
            {holdings.map((holding) => {
              const value = calculateValue(holding);
              const percentage = (value / totalPortfolioValue) * 100;
              return (
                <div key={holding.id}>
                  <div className="flex justify-between mb-2">
                    <span className="text-zinc-900 dark:text-white font-medium">
                      {holding.symbol}
                    </span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Performance Summary
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-400">Number of Holdings</span>
              <span className="font-medium text-zinc-900 dark:text-white">{holdings.length}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-400">Total Invested</span>
              <span className="font-medium text-zinc-900 dark:text-white">
                ${totalCostBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-600 dark:text-zinc-400">Current Value</span>
              <span className="font-medium text-zinc-900 dark:text-white">
                ${totalPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-zinc-600 dark:text-zinc-400">Overall Return</span>
              <span className={`font-medium ${totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalGainLoss >= 0 ? '+' : ''}{totalGainLossPercentage.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
