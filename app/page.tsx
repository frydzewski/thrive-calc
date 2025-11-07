import Link from "next/link";

export default function Home() {
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
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/retirement-calculator"
            className="px-6 py-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
          >
            Try Calculator
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
