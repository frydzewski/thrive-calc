'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { UserProfile, MaritalStatus } from '../types/profile';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [firstname, setFirstname] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus>('single');
  const [numberOfDependents, setNumberOfDependents] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/api/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (data.success && data.profile) {
        setProfile(data.profile);
        setFirstname(data.profile.firstname);
        setDateOfBirth(data.profile.dateOfBirth);
        setMaritalStatus(data.profile.maritalStatus);
        setNumberOfDependents(data.profile.numberOfDependents);
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname,
          dateOfBirth,
          maritalStatus,
          numberOfDependents,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setProfile(data.profile);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
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

  if (!session) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Profile Settings</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Manage your personal information and preferences
        </p>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="firstname"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              First Name
            </label>
            <input
              type="text"
              id="firstname"
              value={firstname}
              onChange={(e) => setFirstname(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              disabled={saving}
              required
            />
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              disabled={saving}
              required
            />
            {profile?.currentAge !== undefined && (
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Current age: {profile.currentAge} years
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="maritalStatus"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Marital Status
            </label>
            <select
              id="maritalStatus"
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value as MaritalStatus)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              disabled={saving}
            >
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="numberOfDependents"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
            >
              Number of Dependents
            </label>
            <input
              type="number"
              id="numberOfDependents"
              value={numberOfDependents}
              onChange={(e) => setNumberOfDependents(parseInt(e.target.value) || 0)}
              min="0"
              max="20"
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-900 dark:text-white dark:bg-zinc-800"
              disabled={saving}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400">
                Profile updated successfully!
              </p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {profile && (
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
              Account Information
            </h3>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-zinc-600 dark:text-zinc-400">Email</dt>
                <dd className="text-sm font-medium text-zinc-900 dark:text-white">
                  {profile.username}
                </dd>
              </div>
              {profile.createdAt && (
                <div>
                  <dt className="text-sm text-zinc-600 dark:text-zinc-400">Member since</dt>
                  <dd className="text-sm font-medium text-zinc-900 dark:text-white">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}
