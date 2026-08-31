import React from 'react';
import { Trash2, Flame, ShieldCheck, Pencil } from 'lucide-react';
import { ClothingItem } from '../types';

interface ItemCardProps {
  item: ClothingItem;
  onDelete: (id: number) => void;
  onEdit?: (item: ClothingItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item, onDelete, onEdit }) => {
  const categoryLabels = {
    top: 'Oberteil',
    pants: 'Hose',
    shoes: 'Schuhe'
  };

  const categoryColors = {
    top: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pants: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shoes: 'bg-amber-50 text-amber-700 border-amber-200'
  };

  const formalityLabels: Record<string, string> = {
    casual: 'Freizeit',
    smart_casual: 'Smart Casual',
    formal: 'Formell',
    athletic: 'Sportlich',
    lounge: 'Homewear'
  };

  return (
    <div className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      {/* Image container */}
      <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
        <img
          src={item.image_url}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80';
          }}
        />

        {/* Category Pill */}
        <span className={`absolute top-2.5 left-2.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-xs ${categoryColors[item.category]}`}>
          {categoryLabels[item.category]}
        </span>

        {/* Waterproof indicator */}
        {item.waterproof && (
          <span className="absolute top-2.5 right-2.5 bg-blue-600/90 text-white p-1 rounded-full shadow-xs" title="Wasserdicht / Regenfest">
            <ShieldCheck className="w-3.5 h-3.5" />
          </span>
        )}

        {/* Action Buttons (hover overlay) */}
        <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-2 bg-white/95 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-xl shadow-md transition-all duration-200 active:scale-90"
              title="Kleidungsstück bearbeiten"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="p-2 bg-white/95 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl shadow-md transition-all duration-200 active:scale-90"
            title="Kleidungsstück löschen"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Info details */}
      <div 
        onClick={() => onEdit && onEdit(item)}
        className="p-3.5 flex-1 flex flex-col justify-between cursor-pointer hover:bg-slate-50/50 transition-colors"
      >
        <div>
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {item.name}
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-xs text-slate-500">
            <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
              {item.color}
            </span>
            {item.fabric && (
              <span className="capitalize text-slate-500">
                • {item.fabric}
              </span>
            )}
            <span className="capitalize text-slate-500">
              • {formalityLabels[item.formality] || item.formality}
            </span>
          </div>
        </div>

        {/* Warmth scale */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Wärmegrad:</span>
          <div className="flex items-center gap-0.5 text-amber-500">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <Flame
                key={lvl}
                className={`w-3.5 h-3.5 ${lvl <= item.warmth_level ? 'fill-amber-500 text-amber-500' : 'text-slate-200'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
