import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClothingItem, 
  WeatherData, 
  OutfitRecommendation, 
  OutfitHistoryItem, 
  VibeType 
} from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { TodayView } from './components/TodayView';
import { ClosetView } from './components/ClosetView';
import { HistoryView } from './components/HistoryView';
import { UploadModal } from './components/UploadModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'today' | 'closet' | 'history'>('today');
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lon: number; city: string }>({
    lat: 52.52,
    lon: 13.405,
    city: 'Berlin'
  });

  // Outfit state
  const [outfit, setOutfit] = useState<OutfitRecommendation | null>(null);
  const [outfitLoading, setOutfitLoading] = useState(false);

  // History state
  const [history, setHistory] = useState<OutfitHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch Wardrobe Items
  const loadItems = async () => {
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (err) {
      console.error('Failed to load items', err);
    }
  };

  // Fetch Weather Forecast
  const loadWeather = useCallback(async (lat = coords.lat, lon = coords.lon, city = coords.city) => {
    try {
      setWeatherLoading(true);
      const data = await api.getCurrentWeather(lat, lon, city);
      setWeather(data);
    } catch (err) {
      console.error('Failed to load weather', err);
    } finally {
      setWeatherLoading(false);
    }
  }, [coords]);

  // Request Outfit Recommendation
  const loadOutfit = useCallback(async (
    currentWeather = weather,
    vibe: VibeType = 'casual',
    lockedTopId?: number | null,
    lockedPantsId?: number | null,
    lockedShoesId?: number | null
  ) => {
    if (!currentWeather) return;
    const topCount = items.filter((i) => i.category === 'top').length;
    const pantsCount = items.filter((i) => i.category === 'pants').length;
    const shoesCount = items.filter((i) => i.category === 'shoes').length;
    if (topCount === 0 || pantsCount === 0 || shoesCount === 0) return;

    try {
      setOutfitLoading(true);
      const res = await api.recommendOutfit({
        weather: currentWeather,
        vibe,
        locked_top_id: lockedTopId,
        locked_pants_id: lockedPantsId,
        locked_shoes_id: lockedShoesId,
      });
      setOutfit(res);
    } catch (err) {
      console.error('Failed to recommend outfit', err);
    } finally {
      setOutfitLoading(false);
    }
  }, [items, weather]);

  // Load History
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await api.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Initial load & Geolocation
  useEffect(() => {
    loadItems();

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            city: 'Current Location'
          };
          setCoords(newCoords);
          loadWeather(newCoords.lat, newCoords.lon, newCoords.city);
        },
        () => {
          // fallback default
          loadWeather(52.52, 13.405, 'Berlin');
        }
      );
    } else {
      loadWeather(52.52, 13.405, 'Berlin');
    }
  }, []);

  // When weather or items change, regenerate outfit if needed
  useEffect(() => {
    if (weather && items.length >= 3 && !outfit) {
      loadOutfit(weather);
    }
  }, [weather, items, outfit, loadOutfit]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  const handleSelectCity = (lat: number, lon: number, cityName: string) => {
    const newCoords = { lat, lon, city: cityName };
    setCoords(newCoords);
    loadWeather(lat, lon, cityName);
  };

  const handleItemAdded = (item: ClothingItem) => {
    setItems((prev) => [item, ...prev]);
    setOutfit(null); // Reset outfit to trigger new recommendation with new piece
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to remove this piece from your closet?')) return;
    try {
      await api.deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setOutfit(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete item');
    }
  };

  const handleSeedSampleWardrobe = async () => {
    try {
      setSeeding(true);
      await api.seedSampleWardrobe();
      await loadItems();
      setOutfit(null);
    } catch (err) {
      console.error(err);
      alert('Failed to seed sample items');
    } finally {
      setSeeding(false);
    }
  };

  const handleWearToday = async () => {
    if (!outfit || !weather) return;
    try {
      await api.logWornOutfit({
        top_id: outfit.top.id,
        pants_id: outfit.pants.id,
        shoes_id: outfit.shoes.id,
        weather,
        ai_explanation: outfit.ai_explanation,
      });
    } catch (err) {
      console.error('Failed to log worn outfit', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setUploadModalOpen(true)}
        itemsCount={items.length}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'today' && (
          <TodayView
            weather={weather}
            weatherLoading={weatherLoading}
            onRefreshWeather={() => loadWeather()}
            onSelectCity={handleSelectCity}
            outfit={outfit}
            outfitLoading={outfitLoading}
            onRecommendOutfit={(vibe, topId, pantsId, shoesId) =>
              loadOutfit(weather, vibe, topId, pantsId, shoesId)
            }
            onWearToday={handleWearToday}
            items={items}
            onOpenUpload={() => setUploadModalOpen(true)}
            onSeedSampleWardrobe={handleSeedSampleWardrobe}
            seeding={seeding}
          />
        )}

        {activeTab === 'closet' && (
          <ClosetView
            items={items}
            onOpenUpload={() => setUploadModalOpen(true)}
            onDeleteItem={handleDeleteItem}
            onSeedSampleWardrobe={handleSeedSampleWardrobe}
            seeding={seeding}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            loading={historyLoading}
          />
        )}
      </main>

      {/* Upload Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onItemAdded={handleItemAdded}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/50 backdrop-blur-xs py-6 mt-12 text-center text-xs text-slate-500 font-medium">
        <p>FitCast • Powered by Open-Meteo & Gemini Multimodal AI</p>
      </footer>

    </div>
  );
};
