export default function Reports() {
  const monthlyData = [
    { month: 'Jan', savings: 4200, contributions: 1500, spending: 3800 },
    { month: 'Feb', savings: 5800, contributions: 1500, spending: 3200 },
    { month: 'Mar', savings: 6200, contributions: 1600, spending: 3400 },
    { month: 'Apr', savings: 7100, contributions: 1700, spending: 3100 },
    { month: 'May', savings: 8500, contributions: 1800, spending: 3300 },
    { month: 'Jun', savings: 9200, contributions: 1500, spending: 3600 },
  ];

  const savingsRate = 35; // percentage
  const emergencyFundMonths = 6;
  const currentEmergencyFund = 24000;
  const monthlyExpenses = 4000;
  const recommendedEmergencyFund = monthlyExpenses * emergencyFundMonths;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
        Financial Reports
      </h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Savings Rate
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            {savingsRate}%
          </div>
          <div className="text-sm text-green-600">Above average (20%)</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Emergency Fund
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            ${currentEmergencyFund.toLocaleString()}
          </div>
          <div className="text-sm text-green-600">
            {(currentEmergencyFund / monthlyExpenses).toFixed(1)} months of expenses
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Net Worth Trend
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
            +15.2%
          </div>
          <div className="text-sm text-green-600">Year over year</div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 mb-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">
          Monthly Savings & Contributions
        </h2>
        <div className="space-y-4">
          {monthlyData.map((data, index) => {
            const maxValue = Math.max(...monthlyData.map(d => Math.max(d.savings, d.contributions, d.spending)));
            return (
              <div key={index}>
                <div className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                  {data.month}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                      Savings: ${data.savings}
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(data.savings / maxValue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                      Contributions: ${data.contributions}
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${(data.contributions / maxValue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                      Spending: ${data.spending}
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                      <div
                        className="bg-orange-600 h-2 rounded-full"
                        style={{ width: `${(data.spending / maxValue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Financial Health Score
          </h2>
          <div className="text-center py-6">
            <div className="text-6xl font-bold text-green-600 mb-2">85</div>
            <div className="text-zinc-600 dark:text-zinc-400">Excellent</div>
          </div>
          <div className="space-y-3 mt-6">
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Emergency Fund</span>
              <span className="flex items-center gap-2">
                <div className="w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">100</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Savings Rate</span>
              <span className="flex items-center gap-2">
                <div className="w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">90</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Debt Management</span>
              <span className="flex items-center gap-2">
                <div className="w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">85</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-600 dark:text-zinc-400">Investment Diversity</span>
              <span className="flex items-center gap-2">
                <div className="w-24 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white">70</span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Recommendations
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">💡</div>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white mb-1">
                    Increase Retirement Contributions
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Consider increasing your 401(k) contribution to maximize employer match benefits.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">✅</div>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white mb-1">
                    Emergency Fund Complete
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    You have {(currentEmergencyFund / monthlyExpenses).toFixed(1)} months of expenses saved. Great job!
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚠️</div>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white mb-1">
                    Diversify Investments
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Consider adding international stocks or bonds to improve portfolio diversification.
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📈</div>
                <div>
                  <div className="font-medium text-zinc-900 dark:text-white mb-1">
                    Tax-Advantaged Accounts
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    Maximize contributions to your IRA to reduce taxable income and grow wealth tax-free.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
