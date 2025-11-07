export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
        Financial Dashboard
      </h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Total Savings
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            $125,450
          </div>
          <div className="text-sm text-green-600 mt-2">+12.5% this year</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Retirement Fund
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            $87,200
          </div>
          <div className="text-sm text-green-600 mt-2">On track</div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Monthly Contribution
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            $1,500
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Target: $2,000
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Years to Retirement
          </div>
          <div className="text-3xl font-bold text-zinc-900 dark:text-white">
            22
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Age 45 → 67
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Recent Goals
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="font-medium text-zinc-900 dark:text-white">
                  Emergency Fund
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  $15,000 / $20,000
                </div>
              </div>
              <div className="text-sm font-medium text-blue-600">75%</div>
            </div>
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <div className="font-medium text-zinc-900 dark:text-white">
                  House Down Payment
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  $42,000 / $60,000
                </div>
              </div>
              <div className="text-sm font-medium text-blue-600">70%</div>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <div className="font-medium text-zinc-900 dark:text-white">
                  Vacation Fund
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  $2,800 / $5,000
                </div>
              </div>
              <div className="text-sm font-medium text-blue-600">56%</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-4">
            Portfolio Allocation
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-900 dark:text-white">Stocks</span>
                <span className="text-zinc-600 dark:text-zinc-400">60%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-900 dark:text-white">Bonds</span>
                <span className="text-zinc-600 dark:text-zinc-400">25%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-zinc-900 dark:text-white">Cash</span>
                <span className="text-zinc-600 dark:text-zinc-400">15%</span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
