'use client';

import { useState } from 'react';
import type { ItineraryDay } from '@/types';

interface Props {
  day: ItineraryDay;
  onAddActivity: (dayNumber: number, title: string) => Promise<void>;
  onRemoveActivity: (dayNumber: number, activityId: string) => Promise<void>;
  onRegenerateDay: (dayNumber: number, feedback: string) => Promise<void>;
}

export default function ItineraryCard({
  day,
  onAddActivity,
  onRemoveActivity,
  onRegenerateDay,
}: Props) {
  const [newActivity, setNewActivity] = useState('');
  const [feedback, setFeedback] = useState('');
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleAdd = async () => {
    if (!newActivity.trim()) return;
    setBusy(true);
    await onAddActivity(day.dayNumber, newActivity.trim());
    setNewActivity('');
    setBusy(false);
  };

  const handleRegenerate = async () => {
    if (!feedback.trim()) return;
    setBusy(true);
    await onRegenerateDay(day.dayNumber, feedback.trim());
    setFeedback('');
    setShowRegenerate(false);
    setBusy(false);
  };

  return (
    <div className="border-l-2 border-brand-500 pl-6 relative">
      <div className="absolute -left-[9px] top-1 w-4 h-4 bg-brand-500 rounded-full border-4 border-white" />

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-slate-800">Day {day.dayNumber}</h3>
        <button
          onClick={() => setShowRegenerate((s) => !s)}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          Regenerate day
        </button>
      </div>

      {showRegenerate && (
        <div className="flex items-center gap-2 mb-4 max-w-md">
          <input
            type="text"
            placeholder='e.g. "more outdoor activities"'
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg text-xs px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button
            onClick={handleRegenerate}
            disabled={busy}
            className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          >
            Apply
          </button>
        </div>
      )}

      <div className="space-y-3 mb-4">
        {day.activities.map((act, idx) => (
          <div
            key={act._id || idx}
            className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-start gap-3"
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-slate-800 text-sm">{act.title}</span>
                <span className="text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
                  {act.timeOfDay}
                </span>
              </div>
              <p className="text-xs text-slate-500">{act.description}</p>
              {act.estimatedCostUSD > 0 && (
                <p className="text-xs text-slate-400 mt-1">~${act.estimatedCostUSD}</p>
              )}
            </div>
            {act._id && (
              <button
                onClick={() => onRemoveActivity(day.dayNumber, act._id!)}
                className="text-slate-400 hover:text-red-500 text-xs shrink-0"
                title="Remove activity"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 max-w-sm">
        <input
          type="text"
          placeholder="Add a new activity..."
          value={newActivity}
          onChange={(e) => setNewActivity(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 border border-slate-300 rounded-lg text-xs px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <button
          onClick={handleAdd}
          disabled={busy}
          className="bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white rounded-lg px-3 py-1.5 text-xs font-semibold transition"
        >
          Add
        </button>
      </div>
    </div>
  );
}
