import React, { useState } from 'react';
import { Sparkles, Plus, AlertCircle } from 'lucide-react';
import { 
  WeatherData, 
  ClothingItem, 
  OutfitRecommendation, 
  VibeType 
} from '../types';
import { WeatherWidget } from './WeatherWidget';
import { OutfitCanvas } from './OutfitCanvas';
import { StylistNote } from './StylistNote';

interface TodayViewProps {
  weather: WeatherData | null;
  weatherLoading: boolean;
  onRefreshWeather: () => void;
  onSelectCity: (lat: number, lon: number, cityName: string) => void;
  outfit: OutfitRecommendation | null;
  outfitLoading: boolean;
  onRecommendOutfit: (
    vibe: VibeType,
    lockedTopId?: number | null,
    lockedPantsId?: number | null,
    lockedShoesId?: number | null,
    lockedJacketId?: number | null
  ) => void;
  onWearToday: () => void;
  items: ClothingItem[];
  onOpenUpload: () => void;
  onSeedSampleWardrobe: () => void;
  seeding: boolean;
}

export const TodayView: React.FC<TodayViewProps> = ({
  weather,
  weatherLoading,
  onRefreshWeather,
  onSelectCity,
  outfit,
  outfitLoading,
  onRecommendOutfit,
  onWearToday,
  items,
  onOpenUpload,
  onSeedSampleWardrobe,
  seeding
}) => {
  const [selectedVibe, setSelectedVibe] = useState<VibeType>('casual');
  const [lockedTop, setLockedTop] = useState(false);
  const [lockedPants, setLockedPants] = useState(false);
  const [lockedShoes, setLockedShoes] = useState(false);
  const [lockedJacket, setLockedJacket] = useState(false);

  const topCount = items.filter((i) => i.category === 'top').length;
  const pantsCount = items.filter((i) => i.category === 'pants').length;
  const shoesCount = items.filter((i) => i.category === 'shoes').length;
  const isWardrobeReady = topCount > 0 && pantsCount > 0 && shoesCount > 0;

  const handleToggleLock = (slot: 'top' | 'pants' | 'shoes' | 'jacket') => {
    if (slot === 'top') setLockedTop(!lockedTop);
    if (slot === 'pants') setLockedPants(!lockedPants);
    if (slot === 'shoes') setLockedShoes(!lockedShoes);
    if (slot === 'jacket') setLockedJacket(!lockedJacket);
  };

  const handleShuffle = () => {
    onRecommendOutfit(
      selectedVibe,
      lockedTop && outfit ? outfit.top.id : null,
      lockedPants && outfit ? outfit.pants.id : null,
      lockedShoes && outfit ? outfit.shoes.id : null,
      lockedJacket && outfit && outfit.jacket ? outfit.jacket.id : null
    );
  };

  const handleVibeChange = (newVibe: VibeType) => {
    setSelectedVibe(newVibe);
    onRecommendOutfit(
      newVibe,
      lockedTop && outfit ? outfit.top.id : null,
      lockedPants && outfit ? outfit.pants.id : null,
      lockedShoes && outfit ? outfit.shoes.id : null,
      lockedJacket && outfit && outfit.jacket ? outfit.jacket.id : null
    );
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Live Weather Banner */}
      <WeatherWidget
        weather={weather}
        loading={weatherLoading}
        onRefresh={onRefreshWeather}
        onSelectCity={onSelectCity}
      />

      {/* 2. Main Outfit Hero Canvas */}
      {isWardrobeReady && outfit ? (
        <div className="space-y-6">
          <OutfitCanvas
            top={outfit.top}
            pants={outfit.pants}
            shoes={outfit.shoes}
            jacket={outfit.jacket}
            lockedTop={lockedTop}
            lockedPants={lockedPants}
            lockedShoes={lockedShoes}
            lockedJacket={lockedJacket}
            onToggleLock={handleToggleLock}
          />

          <StylistNote
            explanation={outfit.ai_explanation}
            stylingTips={outfit.styling_tips}
            weatherFitScore={outfit.weather_fit_score}
            selectedVibe={selectedVibe}
            onChangeVibe={handleVibeChange}
            onShuffle={handleShuffle}
            onWearToday={onWearToday}
            loading={outfitLoading}
          />
        </div>
      ) : isWardrobeReady && outfitLoading ? (
        <div className="bg-white/80 rounded-3xl p-16 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-3">
          <Sparkles className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-base font-bold text-slate-800">
            Dein perfektes Outfit für das heutige Wetter wird zusammengestellt...
          </p>
          <p className="text-xs text-slate-400">
            Wärmegrad, Farbharmonie und Wetterlage werden analysiert
          </p>
        </div>
      ) : (
        /* Incomplete Wardrobe Warning */
        <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Vervollständige deinen Kleiderschrank für Empfehlungen
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1.5 mb-6">
            Clueless benötigt mindestens 1 Oberteil, 1 Hose und 1 Paar Schuhe, um passende Outfits zusammenzustellen.
          </p>

          {/* Checklist */}
          <div className="flex justify-center items-center gap-3 sm:gap-6 mb-8 text-xs font-bold">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${topCount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              <span>Oberteile: {topCount}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${pantsCount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              <span>Hosen: {pantsCount}</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${shoesCount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              <span>Schuhe: {shoesCount}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/25 active:scale-95 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Kleidung hochladen</span>
            </button>

            <button
              onClick={onSeedSampleWardrobe}
              disabled={seeding}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-sm font-bold active:scale-95 transition-all duration-200"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{seeding ? 'Lade Beispiel-Garderobe...' : 'Beispiel-Garderobe laden (13 Teile)'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
