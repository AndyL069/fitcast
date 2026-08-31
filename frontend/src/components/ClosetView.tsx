import React, { useState } from 'react';
import { Shirt, Sparkles, Plus, Search } from 'lucide-react';
import { ClothingItem, CategoryType } from '../types';
import { ItemCard } from './ItemCard';

interface ClosetViewProps {
  items: ClothingItem[];
  onOpenUpload: () => void;
  onDeleteItem: (id: number) => void;
  onSeedSampleWardrobe: () => void;
  seeding: boolean;
}

export const ClosetView: React.FC<ClosetViewProps> = ({
  items,
  onOpenUpload,
  onDeleteItem,
  onSeedSampleWardrobe,
  seeding
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const counts = {
    all: items.length,
    top: items.filter((i) => i.category === 'top').length,
    pants: items.filter((i) => i.category === 'pants').length,
    shoes: items.filter((i) => i.category === 'shoes').length
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fabric.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xs">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'top', 'pants', 'shoes'] as (CategoryType | 'all')[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold capitalize transition-all duration-200 border whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{cat === 'all' ? 'All Pieces' : cat}</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === cat
                    ? 'bg-blue-700/80 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {counts[cat]}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by color, fabric, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Item Grid or Empty State */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onDelete={onDeleteItem}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Shirt className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            {items.length === 0 ? 'Your digital closet is empty' : 'No matching pieces found'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1.5 mb-6">
            {items.length === 0
              ? 'Upload photos of your tops, pants, and shoes so the AI stylist can start matching outfits for you.'
              : 'Try clearing your search filters to view your other clothing items.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Upload Clothing Photo</span>
            </button>

            {items.length === 0 && (
              <button
                onClick={onSeedSampleWardrobe}
                disabled={seeding}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-bold active:scale-95 transition-all duration-200"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>{seeding ? 'Loading Sample Closet...' : 'Load Sample Wardrobe (13 Items)'}</span>
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
