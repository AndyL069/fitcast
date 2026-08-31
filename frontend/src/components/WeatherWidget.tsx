import React, { useState } from 'react';
import { 
  Sun, 
  CloudRain, 
  CloudSnow, 
  Cloud, 
  Wind, 
  Droplets, 
  MapPin, 
  Search, 
  RefreshCw, 
  Flame, 
  Check 
} from 'lucide-react';
import { WeatherData, CitySearchResult } from '../types';
import { api } from '../services/api';

interface WeatherWidgetProps {
  weather: WeatherData | null;
  loading: boolean;
  onRefresh: () => void;
  onSelectCity: (lat: number, lon: number, cityName: string) => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weather,
  loading,
  onRefresh,
  onSelectCity
}) => {
  const [unit, setUnit] = useState<'C' | 'F'>('C');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const formatTemp = (celsius?: number) => {
    if (celsius === undefined || celsius === null) return '--';
    if (unit === 'F') {
      const f = Math.round((celsius * 9) / 5 + 32);
      return `${f}°F`;
    }
    return `${Math.round(celsius)}°C`;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      setIsSearching(true);
      const results = await api.searchCity(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const getWeatherIcon = (w: WeatherData) => {
    if (w.is_snowy) return <CloudSnow className="w-8 h-8 text-sky-400 animate-pulse" />;
    if (w.is_rainy) return <CloudRain className="w-8 h-8 text-blue-500 animate-bounce" />;
    if (w.weather_code <= 1) return <Sun className="w-8 h-8 text-amber-500 animate-spin-slow" />;
    return <Cloud className="w-8 h-8 text-slate-400" />;
  };

  const getWarmthLevelBadge = (target: number) => {
    const labels = [
      '',
      'Sehr leicht (Sommer)',
      'Mild & Warm',
      'Mäßig (Übergangswetter)',
      'Kühl (Jacke empfohlen)',
      'Kalt / Winter (Warmer Mantel)'
    ];
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
        <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
        <span>Ziel-Wärmegrad: Stufe {target}/5 — {labels[target]}</span>
      </div>
    );
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
      {/* Top bar with location and actions */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <MapPin className="w-4 h-4 text-blue-600" />
            <span>{weather?.city || 'Standort wird ermittelt...'}</span>
            <Search className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Unit Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-xs font-bold border border-slate-200">
            <button
              onClick={() => setUnit('C')}
              className={`px-2 py-0.5 rounded ${unit === 'C' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}
            >
              °C
            </button>
            <button
              onClick={() => setUnit('F')}
              className={`px-2 py-0.5 rounded ${unit === 'F' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'}`}
            >
              °F
            </button>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Wettervorhersage aktualisieren"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* City search bar dropdown */}
      {searchOpen && (
        <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Stadt suchen (z.B. Berlin, Wien, Zürich, München)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={isSearching}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              {isSearching ? 'Suche...' : 'Suchen'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
              {searchResults.map((res, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onSelectCity(res.latitude, res.longitude, res.name);
                    setSearchOpen(false);
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-md flex items-center justify-between"
                >
                  <span>{res.display_name}</span>
                  <Check className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Weather stats body */}
      {weather ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100">
              {getWeatherIcon(weather)}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                  {formatTemp(weather.temperature)}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  Gefühlt {formatTemp(weather.apparent_temperature)}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                {weather.condition}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 sm:border-l sm:border-slate-200 sm:pl-5">
            <div className="flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span>{Math.round(weather.precipitation_probability || 0)}% Regen</span>
            </div>
            {weather.wind_speed !== undefined && (
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-slate-400" />
                <span>{Math.round(weather.wind_speed)} km/h</span>
              </div>
            )}
            {getWarmthLevelBadge(weather.comfort_target)}
          </div>
        </div>
      ) : (
        <div className="h-16 flex items-center justify-center text-slate-400 text-sm">
          Wetterdaten werden geladen...
        </div>
      )}
    </div>
  );
};
