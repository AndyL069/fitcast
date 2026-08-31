import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ClothingItem, 
  WeatherData, 
  OutfitRecommendation, 
  OutfitHistoryItem, 
  VibeType 
} from './types';
import { api } from './services/api';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { TodayView } from './components/TodayView';
import { ClosetView } from './components/ClosetView';
import { HistoryView } from './components/HistoryView';
import { UploadModal } from './components/UploadModal';
import { EditItemModal } from './components/EditItemModal';
import { AuthModal } from './components/AuthModal';
import { AlertCircle, X } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'today' | 'closet' | 'history'>('today');
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ClothingItem | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [authErrorBanner, setAuthErrorBanner] = useState<string | null>(null);

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
  const initialOutfitLoadedRef = useRef(false);
  const geolocationInitializedRef = useRef(false);

  // History state
  const [history, setHistory] = useState<OutfitHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Detect OAuth redirect error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('auth_error');
    if (errorParam) {
      setAuthErrorBanner(errorParam);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Fetch Wardrobe Items
  const loadItems = useCallback(async () => {
    try {
      const data = await api.getItems();
      setItems(data);
    } catch (err) {
      console.error('Kleidung konnte nicht geladen werden', err);
    }
  }, []);

  // Fetch Weather Forecast (zero state dependencies)
  const loadWeather = useCallback(async (lat: number, lon: number, city?: string) => {
    try {
      setWeatherLoading(true);
      const data = await api.getCurrentWeather(lat, lon, city);
      setWeather(data);
    } catch (err) {
      console.error('Wetterdaten konnten nicht geladen werden', err);
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  // Request Outfit Recommendation
  const loadOutfit = useCallback(async (
    currentWeather = weather,
    vibe: VibeType = 'casual',
    lockedTopId?: number | null,
    lockedPantsId?: number | null,
    lockedShoesId?: number | null,
    lockedJacketId?: number | null
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
        locked_jacket_id: lockedJacketId,
      });
      setOutfit(res);
      initialOutfitLoadedRef.current = true;
    } catch (err) {
      console.error('Outfit-Empfehlung fehlgeschlagen', err);
    } finally {
      setOutfitLoading(false);
    }
  }, [items, weather]);

  // Load History
  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const data = await api.getHistory();
      setHistory(data);
    } catch (err) {
      console.error('Verlauf konnte nicht geladen werden', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Reload wardrobe ONLY on user login/logout (NOT on tab switch)
  useEffect(() => {
    loadItems();
    setOutfit(null);
    initialOutfitLoadedRef.current = false;
  }, [user, loadItems]);

  // Load History ONLY when entering history tab
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, loadHistory]);

  // Initial load & Geolocation (guarded with ref against infinite loops)
  useEffect(() => {
    if (geolocationInitializedRef.current) return;
    geolocationInitializedRef.current = true;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          const city = 'Aktueller Standort';
          setCoords({ lat, lon, city });
          loadWeather(lat, lon, city);
        },
        () => {
          loadWeather(52.52, 13.405, 'Berlin');
        },
        { timeout: 5000 }
      );
    } else {
      loadWeather(52.52, 13.405, 'Berlin');
    }
  }, [loadWeather]);

  // Only auto-generate initial outfit ONCE when items and weather are ready
  useEffect(() => {
    if (weather && items.length >= 3 && !outfit && !initialOutfitLoadedRef.current) {
      loadOutfit(weather);
    }
  }, [weather, items, outfit, loadOutfit]);

  const handleSelectCity = (lat: number, lon: number, cityName: string) => {
    const newCoords = { lat, lon, city: cityName };
    setCoords(newCoords);
    loadWeather(lat, lon, cityName);
  };

  const handleItemAdded = (item: ClothingItem) => {
    setItems((prev) => [item, ...prev]);
  };

  const handleItemUpdated = (updated: ClothingItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    // Update live outfit if it contains this item
    setOutfit((curr) => {
      if (!curr) return null;
      let newTop = curr.top.id === updated.id ? updated : curr.top;
      let newPants = curr.pants.id === updated.id ? updated : curr.pants;
      let newShoes = curr.shoes.id === updated.id ? updated : curr.shoes;
      let newJacket = curr.jacket?.id === updated.id ? updated : curr.jacket;
      return {
        ...curr,
        top: newTop,
        pants: newPants,
        shoes: newShoes,
        jacket: newJacket,
      };
    });
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Möchtest du dieses Kleidungsstück wirklich aus deinem Schrank entfernen?')) return;
    try {
      await api.deleteItem(id);
      // Immediately remove from UI state
      setItems((prev) => prev.filter((i) => i.id !== id));
      // Invalidate current outfit only if it contained this deleted item
      setOutfit((current) => {
        if (!current) return null;
        if (
          current.top.id === id || 
          current.pants.id === id || 
          current.shoes.id === id || 
          current.jacket?.id === id
        ) {
          return null;
        }
        return current;
      });
    } catch (err) {
      console.error('Löschen fehlgeschlagen:', err);
      alert('Löschen fehlgeschlagen.');
    }
  };

  const handleSeedSampleWardrobe = async () => {
    try {
      setSeeding(true);
      await api.seedSampleWardrobe();
      await loadItems();
    } catch (err) {
      console.error(err);
      alert('Beispiel-Garderobe konnte nicht geladen werden.');
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
        jacket_id: outfit.jacket ? outfit.jacket.id : null,
        weather,
        ai_explanation: outfit.ai_explanation,
      });
    } catch (err) {
      console.error('Getragenes Outfit konnte nicht protokolliert werden', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setUploadModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        itemsCount={items.length}
      />

      {/* Auth Error Banner if redirected with error */}
      {authErrorBanner && (
        <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 pt-4">
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-sm shadow-xs">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{authErrorBanner}</span>
            </div>
            <button
              onClick={() => setAuthErrorBanner(null)}
              className="p-1 text-rose-400 hover:text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'today' && (
          <TodayView
            weather={weather}
            weatherLoading={weatherLoading}
            onRefreshWeather={() => loadWeather(coords.lat, coords.lon, coords.city)}
            onSelectCity={handleSelectCity}
            outfit={outfit}
            outfitLoading={outfitLoading}
            onRecommendOutfit={(vibe, topId, pantsId, shoesId, jacketId) =>
              loadOutfit(weather, vibe, topId, pantsId, shoesId, jacketId)
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
            onEditItem={(item) => setEditingItem(item)}
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

      {/* Edit Item Modal */}
      <EditItemModal
        item={editingItem}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onItemUpdated={handleItemUpdated}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/50 backdrop-blur-xs py-6 mt-12 text-center text-xs text-slate-500 font-medium">
        <p>Clueless • Angetrieben von Open-Meteo & Gemini Multimodal KI</p>
      </footer>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};
