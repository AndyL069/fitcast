import React from 'react';
import { Calendar, CloudSun, Sparkles } from 'lucide-react';
import { OutfitHistoryItem } from '../types';

interface HistoryViewProps {
  history: OutfitHistoryItem[];
  loading: boolean;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, loading }) => {
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div className="bg-white/80 rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Loading outfit history...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">No outfit history yet</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
          When you select "Wear This Today" on an outfit recommendation, your daily choices and the local weather will be tracked here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-slate-900">Worn Outfit Log</h3>
        <span className="text-xs text-slate-500 font-semibold">{history.length} Outfits Recorded</span>
      </div>

      <div className="space-y-4">
        {history.map((record) => (
          <div
            key={record.id}
            className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-slate-900">
                  {formatDate(record.created_at)}
                </span>
                <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {record.vibe}
                </span>
              </div>

              {/* Weather pill */}
              {record.weather && record.weather.temperature !== undefined && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-100 text-xs font-bold">
                  <CloudSun className="w-3.5 h-3.5 text-blue-600" />
                  <span>{Math.round(record.weather.temperature)}°C</span>
                  {record.weather.condition && (
                    <span className="font-medium text-blue-600">• {record.weather.condition}</span>
                  )}
                </div>
              )}
            </div>

            {/* 3 mini photo thumbnails */}
            <div className="grid grid-cols-3 gap-3 my-4">
              {record.top && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-full aspect-square rounded-2xl bg-slate-100 overflow-hidden mb-1.5 border border-slate-200/80">
                    <img
                      src={record.top.image_url}
                      alt={record.top.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">
                    {record.top.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Top</span>
                </div>
              )}

              {record.pants && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-full aspect-square rounded-2xl bg-slate-100 overflow-hidden mb-1.5 border border-slate-200/80">
                    <img
                      src={record.pants.image_url}
                      alt={record.pants.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">
                    {record.pants.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Pants</span>
                </div>
              )}

              {record.shoes && (
                <div className="flex flex-col items-center text-center">
                  <div className="w-full aspect-square rounded-2xl bg-slate-100 overflow-hidden mb-1.5 border border-slate-200/80">
                    <img
                      src={record.shoes.image_url}
                      alt={record.shoes.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">
                    {record.shoes.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Shoes</span>
                </div>
              )}
            </div>

            {/* Stylist explanation */}
            {record.ai_explanation && (
              <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-600 border border-slate-100 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p>{record.ai_explanation}</p>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};
