import React, { useState, useEffect, useCallback } from 'react';
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
import { AuthModal } from './components/AuthModal';
import { AlertCircle, X } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'today' | 'closet' | 'history'>('today');
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
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

  // History state
  const [history, setHistory] = useState<OutfitHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Detect OAuth redirect error
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('auth_error');
    if (errorParam) {
      if (errorParam === 'exchange_failed') {
        setAuthErrorBanner('Authentik-Anmeldung fehlgeschlagen: Der Token-Austausch mit deinem Authentik-Server ist fehlgeschlagen. Bitte prüfe die Docker-Netzwerkverbindung zu auth.am-homelab.de.');
      } else if (errorParam === 'invalid_state') {
        setAuthErrorBanner('Authentik-Sitzung abgelaufen oder ungültig (State-Mismatch). Bitte versuche die Anmeldung erneut.');
      } else {
        setAuthErrorBanner(`Authentik-Fehler: ${errorParam}`);
      }
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

  // Fetch Weather Forecast
  const loadWeather = useCallback(async (lat = coords.lat, lon = coords.lon, city = coords.city) => {
    try {
      setWeatherLoading(true);
      const data = await api.getCurrentWeather(lat, lon, city);
      setWeather(data);
    } catch (err) {
      console.error('Wetterdaten konnten nicht geladen werden', err);
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
      console.error('Outfit-Empfehlung fehlgeschlagen', err);
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
      console.error('Verlauf konnte nicht geladen werden', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Reload wardrobe on user login/logout
  useEffect(() => {
    loadItems();
    setOutfit(null);
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [user, loadItems, activeTab]);

  // Initial load & Geolocation
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newCoords = {
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            city: 'Aktueller Standort'
          };
          setCoords(newCoords);
          loadWeather(newCoords.lat, newCoords.lon, newCoords.city);
        },
        () => {
          loadWeather(52.52, 13.405, 'Berlin');
        }
      );
    } else {
      loadWeather(52.52, 13.405, 'Berlin');
    }
  }, []);

  useEffect(() => {
    if (weather && items.length >= 3 && !outfit) {
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
    setOutfit(null);
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Möchtest du dieses Kleidungsstück wirklich aus deinem Schrank entfernen?')) return;
    try {
      await api.deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      setOutfit(null);
    } catch (err) {
      console.error(err);
      alert('Löschen fehlgeschlagen.');
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

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/50 backdrop-blur-xs py-6 mt-12 text-center text-xs text-slate-500 font-medium">
        <p>FitCast • Angetrieben von Open-Meteo & Gemini Multimodal KI</p>
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
