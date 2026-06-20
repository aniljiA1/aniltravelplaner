'use client';

import type { Trip } from '@/types';

interface Props {
  trips: Trip[];
  selectedTripId: string | undefined;
  onSelect: (trip: Trip) => void;
  onDelete: (tripId: string) => void;
}

export default function TripList({ trips, selectedTripId, onSelect, onDelete }: Props) {
  if (trips.length === 0) {
    return <p className="text-sm text-slate-500">No trips yet. Create one to get started!</p>;
  }

  return (
    <div className="space-y-3">
      {trips.map((trip) => (
        <div
          key={trip._id}
          onClick={() => onSelect(trip)}
          className={`w-full text-left p-4 rounded-xl cursor-pointer transition border ${
            selectedTripId === trip._id
              ? 'bg-brand-600 border-brand-600 text-white'
              : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300'
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-sm">{trip.destination}</p>
              <p
                className={`text-xs mt-0.5 ${
                  selectedTripId === trip._id ? 'text-brand-100' : 'text-slate-400'
                }`}
              >
                {trip.durationDays} days • {trip.budgetTier} budget
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(trip._id);
              }}
              className={`text-xs shrink-0 ${
                selectedTripId === trip._id
                  ? 'text-brand-100 hover:text-white'
                  : 'text-slate-300 hover:text-red-500'
              }`}
              title="Delete trip"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
