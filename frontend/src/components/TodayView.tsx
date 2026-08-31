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
    lockedJacketId?: number | null,
    includeJacket?: boolean
  ) => void;
  onWearToday: () => void;
  onOpenInspire: () => void;
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
  onOpenInspire,
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
  const [jacketEnabled, setJacketEnabled] = useState(false);

  const topCount = items.filter((i) => i.category === 'top').length;
  const pantsCount = items.filter((i) => i.category === 'pants').length;
  const shoesCount = items.filter((i) => i.category === 'shoes').length;
  const jacketCount = items.filter((i) => i.category === 'jacket').length;
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
      lockedJacket && outfit && outfit.jacket ? outfit.jacket.id : null,
      jacketEnabled
    );
  };

  const handleVibeChange = (newVibe: VibeType) => {
    setSelectedVibe(newVibe);
    onRecommendOutfit(
      newVibe,
      lockedTop && outfit ? outfit.top.id : null,
      lockedPants && outfit ? outfit.pants.id : null,
      lockedShoes && outfit ? outfit.shoes.id : null,
      lockedJacket && outfit && outfit.jacket ? outfit.jacket.id : null,
      jacketEnabled
    );
  };

  const handleToggleJacket = () => {
    const newValue = !jacketEnabled;
    setJacketEnabled(newValue);
    if (!newValue) {
      setLockedJacket(false);
    }
    // Keep current 3 pieces (top, pants, shoes) and add/remove the 4th piece (jacket)
    onRecommendOutfit(
      selectedVibe,
      outfit ? outfit.top.id : null,
      outfit ? outfit.pants.id : null,
      outfit ? outfit.shoes.id : null,
      null, // reset locked jacket when toggling
      newValue
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

          {/* Jacket Toggle */}
          {jacketCount > 0 && (
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-md rounded-2xl px-4 py-3 border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="text-lg">🧥</span>
                <div>
                  <span className="text-sm font-bold text-slate-900">Jacke hinzufügen</span>
                  <span className="text-xs text-slate-500 ml-2">
                    {jacketCount} {jacketCount === 1 ? 'Jacke' : 'Jacken'} verfügbar
                  </span>
                </div>
              </div>
              <button
                onClick={handleToggleJacket}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer ${
                  jacketEnabled ? 'bg-blue-600' : 'bg-slate-300'
                }`}
                role="switch"
                aria-checked={jacketEnabled}
                aria-label="Jacke zum Outfit hinzufügen"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    jacketEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          <OutfitCanvas
            top={outfit.top}
            pants={outfit.pants}
            shoes={outfit.shoes}
            jacket={jacketEnabled ? outfit.jacket : null}
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
            onOpenInspire={onOpenInspire}
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
