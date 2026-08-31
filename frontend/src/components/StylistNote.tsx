import React, { useState } from 'react';
import { Sparkles, Shuffle, CheckCircle2, Lightbulb, Shirt, ArrowRight } from 'lucide-react';
import { VibeType } from '../types';

interface StylistNoteProps {
  explanation: string;
  stylingTips: string[];
  weatherFitScore: number;
  selectedVibe: VibeType;
  onChangeVibe: (vibe: VibeType) => void;
  onShuffle: () => void;
  onWearToday: () => void;
  loading: boolean;
}

export const StylistNote: React.FC<StylistNoteProps> = ({
  explanation,
  stylingTips,
  weatherFitScore,
  selectedVibe,
  onChangeVibe,
  onShuffle,
  onWearToday,
  loading
}) => {
  const [wornSaved, setWornSaved] = useState(false);

  const handleWear = () => {
    onWearToday();
    setWornSaved(true);
    setTimeout(() => setWornSaved(false), 3000);
  };

  const vibes: { id: VibeType; label: string }[] = [
    { id: 'casual', label: 'Freizeit' },
    { id: 'smart_casual', label: 'Smart Casual' },
    { id: 'formal', label: 'Formell' },
    { id: 'all', label: 'Jeder Anlass' }
  ];

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-6 border border-slate-200 shadow-md">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>KI-Stylist Empfehlung</span>
            </h3>
            <p className="text-xs text-slate-500">
              Personalisierte Farbharmonie & Thermo-Analyse
            </p>
          </div>
        </div>

        {/* Fit Score Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{weatherFitScore}% Wetter- & Stil-Passung</span>
        </div>
      </div>

      {/* Vibe Selection */}
      <div className="my-4 flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
          Anlass:
        </span>
        {vibes.map((v) => (
          <button
            key={v.id}
            onClick={() => onChangeVibe(v.id)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all duration-200 border whitespace-nowrap ${
              selectedVibe === v.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Stylist Explanation Commentary */}
      <div className="bg-white/80 rounded-2xl p-4 border border-blue-100 text-sm text-slate-800 leading-relaxed shadow-xs">
        <p>{explanation}</p>
      </div>

      {/* Styling Tips */}
      {stylingTips && stylingTips.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            <span>Styling-Tipps</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
            {stylingTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-1.5 bg-white/60 px-3 py-2 rounded-xl border border-slate-100">
                <span className="text-blue-500 font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Shuffle */}
        <button
          onClick={onShuffle}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 text-sm font-bold shadow-xs active:scale-95 transition-all duration-200 disabled:opacity-50"
        >
          <Shuffle className={`w-4 h-4 text-blue-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Neu mischen / Andere Kombination</span>
        </button>

        {/* Wear this today */}
        <button
          onClick={handleWear}
          disabled={wornSaved}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-bold shadow-md active:scale-95 transition-all duration-200 ${
            wornSaved
              ? 'bg-emerald-600 shadow-emerald-600/25'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25'
          }`}
        >
          {wornSaved ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Im Verlauf gespeichert!</span>
            </>
          ) : (
            <>
              <Shirt className="w-4 h-4" />
              <span>Heute anziehen</span>
              <ArrowRight className="w-4 h-4 ml-1 opacity-80" />
            </>
          )}
        </button>

      </div>

    </div>
  );
};
