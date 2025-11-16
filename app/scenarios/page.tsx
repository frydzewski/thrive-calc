'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Scenario } from '../types/scenarios';
import ScenarioModal from '../components/ScenarioModal';

export default function Scenarios() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [settingDefault, setSettingDefault] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  // Fetch scenarios on mount
  useEffect(() => {
    if (status === 'authenticated') {
      fetchScenarios();
    }
  }, [status]);

  const fetchScenarios = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/scenarios');

      if (!response.ok) {
        throw new Error('Failed to fetch scenarios');
      }

      const data = await response.json();
      if (data.success) {
        setScenarios(data.scenarios || []);
      } else {
        throw new Error(data.error || 'Failed to fetch scenarios');
      }
    } catch (err) {
      console.error('Error fetching scenarios:', err);
      setError('Failed to load scenarios. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddScenario = () => {
    setSelectedScenario(null);
    setShowModal(true);
  };

  const handleEditScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setShowModal(true);
  };

  const handleCloseModal = async (saved: boolean) => {
    setShowModal(false);
    setSelectedScenario(null);
    if (saved) {
      await fetchScenarios();
    }
  };

  const handleSetDefault = async (scenarioId: string) => {
    try {
      setSettingDefault(scenarioId);
      setError(null);

      const response = await fetch(`/api/scenarios/${scenarioId}/set-default`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to set default scenario');
      }

      await fetchScenarios();
    } catch (err) {
      console.error('Error setting default scenario:', err);
      setError(err instanceof Error ? err.message : 'Failed to set default scenario');
    } finally {
      setSettingDefault(null);
    }
  };

  const handleDeleteScenario = async (scenarioId: string, scenarioName: string) => {
    if (!confirm(`Are you sure you want to delete "${scenarioName}"?`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/scenarios/${scenarioId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete scenario');
      }

      await fetchScenarios();
    } catch (err) {
      console.error('Error deleting scenario:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete scenario');
    }
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (status === 'unauthenticated') {
    return null;
  }

  const defaultScenario = scenarios.find((s) => s.isDefault);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Scenarios</h1>
        <button
          onClick={handleAddScenario}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Scenario
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {scenarios.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              No scenarios yet
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Create your first scenario to explore different financial planning assumptions and
              projections.
            </p>
            <button
              onClick={handleAddScenario}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Create Your First Scenario
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`bg-white dark:bg-zinc-900 p-6 rounded-lg border-2 transition-colors ${
                scenario.isDefault
                  ? 'border-blue-500 dark:border-blue-400'
                  : 'border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      {scenario.name}
                    </h3>
                    {scenario.isDefault && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        <svg
                          className="w-3 h-3 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Default
                      </span>
                    )}
                  </div>
                  {scenario.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {scenario.description}
                    </p>
                  )}
                  <div className="mt-3 flex gap-4 text-sm text-zinc-500 dark:text-zinc-400">
                    <span>{scenario.assumptionBuckets.length} assumption bucket(s)</span>
                    <span>{scenario.lumpSumEvents.length} lump sum event(s)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {!scenario.isDefault && (
                    <button
                      onClick={() => handleSetDefault(scenario.id)}
                      disabled={settingDefault === scenario.id}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors disabled:opacity-50"
                    >
                      {settingDefault === scenario.id ? 'Setting...' : 'Set as Default'}
                    </button>
                  )}
                  <button
                    onClick={() => handleEditScenario(scenario)}
                    className="px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteScenario(scenario.id, scenario.name)}
                    className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ScenarioModal scenario={selectedScenario} onClose={handleCloseModal} />
      )}
    </div>
  );
}
