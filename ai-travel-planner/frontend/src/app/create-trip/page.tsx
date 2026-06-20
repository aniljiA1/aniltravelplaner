'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/utils/api';
import type { Trip } from '@/types';

const INTEREST_OPTIONS = ['Food', 'Culture', 'Adventure', 'Shopping', 'Nature', 'Nightlife', 'Relaxation', 'History'];

export default function CreateTripPage() {
  const router = useRouter();
  const [destination, setDestination] = useState('');
  const [durationDays, setDurationDays] = useState(5);
  const [budgetTier, setBudgetTier] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [interests, setInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/login');
    }
  }, [router]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const trip = await api.post<Trip>('/api/trips/generate', {
        destination,
        durationDays,
        budgetTier,
        interests,
      });
      router.push(`/dashboard?tripId=${trip._id}`);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Something went wrong generating your trip. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Plan a new trip</h1>
        <p className="text-sm text-slate-500 mb-6">
          Tell us your preferences and our AI agent will build your itinerary.
        </p>

        {error && (
          <div className="mb-4 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
            <input
              type="text"
              required
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Tokyo, Japan"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Number of days
            </label>
            <input
              type="number"
              min={1}
              max={30}
              required
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Budget tier</label>
            <div className="grid grid-cols-3 gap-3">
              {(['Low', 'Medium', 'High'] as const).map((tier) => (
                <button
                  type="button"
                  key={tier}
                  onClick={() => setBudgetTier(tier)}
                  className={`py-2 rounded-lg text-sm font-semibold border transition ${
                    budgetTier === tier
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-brand-400'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Interests</label>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((interest) => (
                <button
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    interests.includes(interest)
                      ? 'bg-brand-50 text-brand-700 border-brand-400'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-brand-300'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition"
          >
            {loading ? 'Generating your itinerary... (this can take ~10-20s)' : 'Generate Itinerary'}
          </button>
        </form>
      </div>
    </main>
  );
}
