'use client';

import type { PackingItem } from '@/types';

interface Props {
  packingList: PackingItem[];
  onToggle: (itemId: string) => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  Documents: '🛂',
  Clothing: '👕',
  Gear: '🎒',
  Other: '🧴',
};

export default function PackingList({ packingList, onToggle }: Props) {
  if (!packingList || packingList.length === 0) {
    return <p className="text-xs text-slate-500">Generating your weather-aware checklist...</p>;
  }

  const categories = ['Documents', 'Clothing', 'Gear', 'Other'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {categories.map((category) => {
        const items = packingList.filter((i) => i.category === category);
        if (items.length === 0) return null;

        return (
          <div key={category} className="space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wide">
              {CATEGORY_ICONS[category]} {category}
            </h4>
            {items.map((item) => (
              <div
                key={item._id}
                onClick={() => item._id && onToggle(item._id)}
                className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:border-brand-300 transition"
              >
                <input
                  type="checkbox"
                  checked={item.isPacked}
                  readOnly
                  className="h-4 w-4 rounded accent-emerald-500 cursor-pointer"
                />
                <span
                  className={`text-sm ${
                    item.isPacked ? 'line-through text-slate-400' : 'text-slate-700'
                  }`}
                >
                  {item.item}
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
