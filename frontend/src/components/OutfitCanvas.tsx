import React from 'react';
import { Lock, Unlock, Flame, ShieldCheck } from 'lucide-react';
import { ClothingItem } from '../types';

interface OutfitCanvasProps {
  top: ClothingItem;
  pants: ClothingItem;
  shoes: ClothingItem;
  jacket?: ClothingItem | null;
  lockedTop: boolean;
  lockedPants: boolean;
  lockedShoes: boolean;
  lockedJacket: boolean;
  onToggleLock: (slot: 'top' | 'pants' | 'shoes' | 'jacket') => void;
}

export const OutfitCanvas: React.FC<OutfitCanvasProps> = ({
  top,
  pants,
  shoes,
  jacket,
  lockedTop,
  lockedPants,
  lockedShoes,
  lockedJacket,
  onToggleLock
}) => {
  const formalityLabels: Record<string, string> = {
    casual: 'Freizeit',
    smart_casual: 'Smart Casual',
    formal: 'Formell',
    athletic: 'Sportlich',
    lounge: 'Homewear'
  };

  const renderSlotCard = (
    item: ClothingItem,
    slot: 'top' | 'pants' | 'shoes' | 'jacket',
    isLocked: boolean,
    slotTitle: string
  ) => {
    return (
      <div className="relative flex-1 bg-white rounded-3xl border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col group">
        
        {/* Slot Header Banner */}
        <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${slot === 'jacket' ? 'bg-indigo-600' : 'bg-blue-600'}`}></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {slotTitle}
            </span>
          </div>

          {/* Lock Button */}
          <button
            onClick={() => onToggleLock(slot)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
              isLocked
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-white text-slate-500 hover:text-slate-800 border border-slate-200 shadow-xs'
            }`}
            title={isLocked ? 'Teil ist beim Neumischen fixiert' : 'Teil fixieren, um es beim Neumischen beizubehalten'}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>Fixiert</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Fixieren</span>
              </>
            )}
          </button>
        </div>

        {/* Photo Canvas */}
        <div className="relative aspect-4/3 sm:aspect-square w-full bg-slate-100 overflow-hidden">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80';
            }}
          />

          {/* Badges overlay */}
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-amber-800 border border-slate-200/80 text-[11px] font-bold shadow-xs">
              <Flame className="w-3 h-3 text-amber-600 fill-amber-500" />
              <span>Stufe {item.warmth_level}</span>
            </div>

            {item.waterproof && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/90 backdrop-blur-xs text-white text-[11px] font-bold shadow-xs">
                <ShieldCheck className="w-3 h-3" />
                <span>Wasserdicht</span>
              </div>
            )}
          </div>
        </div>

        {/* Card Details */}
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
              {item.name}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span className="capitalize px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold">
                {item.color}
              </span>
              {item.fabric && (
                <span className="capitalize px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                  {item.fabric}
                </span>
              )}
              <span className="capitalize text-slate-500">
                • {formalityLabels[item.formality] || item.formality}
              </span>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const hasJacket = Boolean(jacket);

  return (
    <div className={`grid gap-4 lg:gap-6 ${hasJacket ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
      {jacket && renderSlotCard(jacket, 'jacket', lockedJacket, 'Jacke & Mantel')}
      {renderSlotCard(top, 'top', lockedTop, 'Oberteil')}
      {renderSlotCard(pants, 'pants', lockedPants, 'Hose / Unterteil')}
      {renderSlotCard(shoes, 'shoes', lockedShoes, 'Schuhe')}
    </div>
  );
};
