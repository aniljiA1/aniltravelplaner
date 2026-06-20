'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, clearToken, getUser, ApiError } from '@/utils/api';
import type { Trip, User } from '@/types';
import TripList from '@/components/TripList';
import ItineraryCard from '@/components/ItineraryCard';
import PackingList from '@/components/PackingList';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUserState] = useState<User | null>(null);

  const fetchTrips = useCallback(async () => {
    try {
      const data = await api.get<Trip[]>('/api/trips');
      setTrips(data);
      const requestedId = searchParams.get('tripId');
      const match = requestedId ? data.find((t) => t._id === requestedId) : null;
      setSelectedTrip(match || data[0] || null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.push('/login');
        return;
      }
      setError('Failed to load your trips. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push('/login');
      return;
    }
    setUserState(getUser<User>());
    fetchTrips();
  }, [fetchTrips, router]);

  const handleLogout = () => {
    clearToken();
    router.push('/login');
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Delete this trip permanently?')) return;
    try {
      await api.delete(`/api/trips/${tripId}`);
      const remaining = trips.filter((t) => t._id !== tripId);
      setTrips(remaining);
      if (selectedTrip?._id === tripId) {
        setSelectedTrip(remaining[0] || null);
      }
    } catch {
      alert('Failed to delete trip.');
    }
  };

  const handleAddActivity = async (dayNumber: number, title: string) => {
    if (!selectedTrip) return;
    try {
      const updated = await api.post<Trip>(`/api/trips/${selectedTrip._id}/activities`, {
        dayNumber,
        activity: { title, description: 'Added by traveler', estimatedCostUSD: 0, timeOfDay: 'Afternoon' },
      });
      setSelectedTrip(updated);
      setTrips((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } catch {
      alert('Failed to add activity.');
    }
  };

  const handleRemoveActivity = async (dayNumber: number, activityId: string) => {
    if (!selectedTrip) return;
    try {
      const updated = await api.post<Trip>(`/api/trips/${selectedTrip._id}/activities/remove`, {
        dayNumber,
        activityId,
      });
      setSelectedTrip(updated);
      setTrips((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } catch {
      alert('Failed to remove activity.');
    }
  };

  const handleRegenerateDay = async (dayNumber: number, feedback: string) => {
    if (!selectedTrip) return;
    try {
      const updated = await api.post<Trip>(`/api/trips/${selectedTrip._id}/regenerate-day`, {
        dayNumber,
        feedback,
      });
      setSelectedTrip(updated);
      setTrips((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } catch {
      alert('Failed to regenerate day. The AI service may be busy — please try again.');
    }
  };

  const handleTogglePacking = async (itemId: string) => {
    if (!selectedTrip) return;
    const updatedPacking = selectedTrip.packingList.map((item) =>
      item._id === itemId ? { ...item, isPacked: !item.isPacked } : item
    );
    // Optimistic update
    setSelectedTrip({ ...selectedTrip, packingList: updatedPacking });
    try {
      const updated = await api.put<Trip>(`/api/trips/${selectedTrip._id}`, {
        packingList: updatedPacking,
      });
      setTrips((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } catch {
      alert('Failed to update packing list.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <p className="text-slate-500 animate-pulse">Loading your trips...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-brand-600">✈️ Trao Dashboard</h1>
          {user && <p className="text-xs text-slate-400">Welcome back, {user.name}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/create-trip"
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            + New Trip
          </Link>
          <button
            onClick={handleLogout}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto mt-4 text-sm bg-red-50 text-red-600 border border-red-200 rounded-lg px-4 py-2">
          {error}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
              Your Trips
            </h2>
            <TripList
              trips={trips}
              selectedTripId={selectedTrip?._id}
              onSelect={setSelectedTrip}
              onDelete={handleDeleteTrip}
            />
          </div>

          {selectedTrip && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                Budget Breakdown
              </h2>
              <div className="space-y-2 text-sm">
                <Row label="Flights" value={selectedTrip.estimatedBudget.flights} />
                <Row label="Transport" value={selectedTrip.estimatedBudget.transport} />
                <Row label="Accommodation" value={selectedTrip.estimatedBudget.accommodation} />
                <Row label="Food" value={selectedTrip.estimatedBudget.food} />
                <Row label="Activities" value={selectedTrip.estimatedBudget.activities} />
                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total</span>
                  <span>${selectedTrip.estimatedBudget.total}</span>
                </div>
              </div>
            </div>
          )}

          {selectedTrip && selectedTrip.hotels?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">
                Recommended Hotels
              </h2>
              <div className="space-y-3">
                {selectedTrip.hotels.map((hotel, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-lg p-3">
                    <p className="font-semibold text-sm text-slate-800">{hotel.name}</p>
                    <p className="text-xs text-slate-500">
                      {hotel.tier} • ${hotel.estimatedCostNightUSD}/night • {hotel.rating}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedTrip ? (
            <>
              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-3">
                  Day-by-Day Itinerary: {selectedTrip.destination}
                </h2>
                <div className="space-y-8">
                  {selectedTrip.itinerary.map((day) => (
                    <ItineraryCard
                      key={day.dayNumber}
                      day={day}
                      onAddActivity={handleAddActivity}
                      onRemoveActivity={handleRemoveActivity}
                      onRegenerateDay={handleRegenerateDay}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-1">
                  🧳 AI Weather-Aware Packing Assistant
                </h2>
                <p className="text-xs text-slate-500 mb-5">
                  Generated from your destination&apos;s climate and planned activities.
                </p>
                <PackingList
                  packingList={selectedTrip.packingList}
                  onToggle={handleTogglePacking}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-center items-center h-96 bg-white border border-slate-200 rounded-2xl">
              <span className="text-5xl mb-4">✈️</span>
              <p className="text-slate-500 mb-4">No trip selected yet.</p>
              <Link
                href="/create-trip"
                className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                Create your first trip
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-slate-600">
      <span>{label}</span>
      <span className="font-medium text-slate-800">${value}</span>
    </div>
  );
}
