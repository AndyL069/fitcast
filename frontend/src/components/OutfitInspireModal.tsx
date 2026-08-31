import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  ShoppingBag, 
  Shirt, 
  ExternalLink, 
  Check, 
  Layers,
  Lightbulb
} from 'lucide-react';
import { 
  OutfitRecommendation, 
  WeatherData, 
  VibeType, 
  ClothingItem, 
  CategoryType,
  MatchSuggestionsResponse 
} from '../types';
import { api } from '../services/api';

interface OutfitInspireModalProps {
  isOpen: boolean;
  onClose: () => void;
  outfit: OutfitRecommendation | null;
  weather: WeatherData | null;
  vibe?: VibeType;
  onSwapItem: (item: ClothingItem, replacesCategory: CategoryType) => void;
}

export const OutfitInspireModal: React.FC<OutfitInspireModalProps> = ({
  isOpen,
  onClose,
  outfit,
  weather,
  vibe = 'casual',
  onSwapItem
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'closet' | 'shopping'>('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MatchSuggestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [swappedItemId, setSwappedItemId] = useState<number | null>(null);

  useEffect(() => {
    if (!isOpen || !outfit || !weather) return;

    let isMounted = true;
    const fetchSuggestions = async () => {
      try {
        setLoading(true);
        setError(null);
        setSwappedItemId(null);
        const res = await api.getMatchSuggestions({
          current_top_id: outfit.top.id,
          current_pants_id: outfit.pants.id,
          current_shoes_id: outfit.shoes.id,
          current_jacket_id: outfit.jacket ? outfit.jacket.id : null,
          weather,
          vibe
        });
        if (isMounted) {
          setData(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Vorschläge konnten nicht geladen werden');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSuggestions();

    return () => {
      isMounted = false;
    };
  }, [isOpen, outfit, weather, vibe]);

  if (!isOpen) return null;

  const categoryNames: Record<CategoryType, string> = {
    top: 'Oberteil',
    jacket: 'Jacke/Mantel',
    pants: 'Hose',
    shoes: 'Schuhe'
  };

  const handleApplyAlternative = (item: ClothingItem, category: CategoryType) => {
    onSwapItem(item, category);
    setSwappedItemId(item.id);
    setTimeout(() => {
      setSwappedItemId(null);
    }, 2500);
  };

  const openShoppingSearch = (query: string) => {
    const url = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Look erweitern & Alternativen</h3>
              <p className="text-xs text-white/80">Styling-Inspirationen & passende Stücke für dein Outfit</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Alles anzeigen
            </button>
            <button
              onClick={() => setActiveTab('closet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'closet'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Shirt className="w-3.5 h-3.5" />
              <span>Aus deinem Schrank</span>
              {data && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px]">
                  {data.closet_alternatives.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('shopping')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'shopping'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Shopping-Ideen</span>
              {data && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">
                  {data.shopping_suggestions.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-bold text-slate-800">
                Cher analysiert deinen Kleiderschrank & Shopping-Kombinationen...
              </p>
              <p className="text-xs text-slate-400">
                Farben, Stoffe und Wetterlage werden harmonisch abgeglichen
              </p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold text-center">
              {error}
            </div>
          ) : data ? (
            <>
              {/* Stylist Summary Callout */}
              {data.stylist_summary && (
                <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white text-indigo-600 shadow-xs shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-0.5">
                      Styling-Tipp der KI
                    </h4>
                    <p className="text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
                      {data.stylist_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Section 1: Closet Alternatives */}
              {(activeTab === 'all' || activeTab === 'closet') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Passende Alternativen aus deinem Schrank
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {data.closet_alternatives.length} Vorschläge
                    </span>
                  </div>

                  {data.closet_alternatives.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500 border border-slate-200/80">
                      Lade noch mehr Oberteile, Hosen oder Jacken hoch, um passende Schrank-Alternativen vorgeschlagen zu bekommen.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {data.closet_alternatives.map((alt) => {
                        const isSwapped = swappedItemId === alt.item.id;
                        return (
                          <div
                            key={alt.item.id}
                            className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-3.5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                          >
                            <div className="flex items-start gap-3">
                              <img
                                src={alt.item.image_url}
                                alt={alt.item.name}
                                className="w-16 h-16 rounded-xl object-cover border border-slate-200/80 shrink-0 bg-slate-100"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=500&auto=format&fit=crop&q=80';
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 truncate">
                                    Ersetzt {categoryNames[alt.replaces_category] || alt.replaces_category}
                                  </span>
                                </div>
                                <h5 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                                  {alt.item.name}
                                </h5>
                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                  {alt.item.color} • {alt.item.fabric}
                                </p>
                              </div>
                            </div>

                            {/* Why it matches */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100">
                              <p className="text-xs text-slate-600 italic bg-slate-50/80 p-2 rounded-lg border border-slate-100">
                                „{alt.reason}“
                              </p>
                            </div>

                            {/* Apply Button */}
                            <button
                              onClick={() => handleApplyAlternative(alt.item, alt.replaces_category)}
                              className={`mt-3 w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isSwapped
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-sm active:scale-98'
                              }`}
                            >
                              {isSwapped ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Im Outfit übernommen!</span>
                                </>
                              ) : (
                                <>
                                  <Layers className="w-3.5 h-3.5" />
                                  <span>Im Outfit übernehmen</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Section 2: Shopping Suggestions */}
              {(activeTab === 'all' || activeTab === 'shopping') && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-bold text-slate-900">
                        Shopping-Vorschläge & Wunschliste
                      </h4>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {data.shopping_suggestions.length} Ideen
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {data.shopping_suggestions.map((shop, idx) => (
                      <div
                        key={idx}
                        className="bg-gradient-to-br from-white to-indigo-50/30 border border-slate-200 hover:border-indigo-300 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {shop.category}
                            </span>
                            <span className="text-[11px] font-semibold text-slate-500">
                              Farbe: {shop.color}
                            </span>
                          </div>
                          <h5 className="text-sm font-bold text-slate-900">
                            {shop.title}
                          </h5>
                          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                            {shop.why}
                          </p>
                        </div>

                        {/* Search Link */}
                        <button
                          onClick={() => openShoppingSearch(shop.search_query)}
                          className="mt-4 w-full py-2 px-3 rounded-xl text-xs font-bold bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 hover:border-indigo-300 shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer group"
                        >
                          <span>🛍️ Online suchen</span>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Kombinationen werden dynamisch an deinen Kleiderschrank & das aktuelle Wetter angepasst.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
