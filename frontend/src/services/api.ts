import {
  ClothingItem,
  WeatherData,
  CitySearchResult,
  OutfitRecommendation,
  OutfitHistoryItem,
  CategoryType,
  VibeType
} from '../types';

const API_BASE = '/api';

export const api = {
  // Items
  async getItems(category?: CategoryType): Promise<ClothingItem[]> {
    const url = category ? `${API_BASE}/items?category=${category}` : `${API_BASE}/items`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch wardrobe items');
    return res.json();
  },

  async uploadItem(formData: FormData): Promise<ClothingItem> {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Failed to upload item');
    }
    return res.json();
  },

  async deleteItem(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete item');
  },

  async analyzePhoto(file: File): Promise<Partial<ClothingItem>> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/items/analyze`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to analyze photo');
    return res.json();
  },

  async seedSampleWardrobe(): Promise<{ message: string; count: number }> {
    const res = await fetch(`${API_BASE}/items/seed-sample-wardrobe`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to seed sample wardrobe');
    return res.json();
  },

  // Weather
  async getCurrentWeather(lat: number, lon: number, city?: string): Promise<WeatherData> {
    const cityParam = city ? `&city=${encodeURIComponent(city)}` : '';
    const res = await fetch(`${API_BASE}/weather/current?lat=${lat}&lon=${lon}${cityParam}`);
    if (!res.ok) throw new Error('Failed to load weather data');
    return res.json();
  },

  async searchCity(query: string): Promise<CitySearchResult[]> {
    const res = await fetch(`${API_BASE}/weather/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search locations');
    return res.json();
  },

  // Outfit
  async recommendOutfit(params: {
    weather: WeatherData;
    vibe?: VibeType;
    locked_top_id?: number | null;
    locked_pants_id?: number | null;
    locked_shoes_id?: number | null;
  }): Promise<OutfitRecommendation> {
    const res = await fetch(`${API_BASE}/outfit/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to generate outfit' }));
      throw new Error(err.detail || 'Failed to generate outfit recommendation');
    }
    return res.json();
  },

  async logWornOutfit(params: {
    top_id: number;
    pants_id: number;
    shoes_id: number;
    weather: WeatherData;
    ai_explanation: string;
    vibe?: string;
  }): Promise<void> {
    const url = new URL(`${window.location.origin}${API_BASE}/outfit/wear`);
    url.searchParams.set('top_id', String(params.top_id));
    url.searchParams.set('pants_id', String(params.pants_id));
    url.searchParams.set('shoes_id', String(params.shoes_id));
    url.searchParams.set('weather_json', JSON.stringify(params.weather));
    url.searchParams.set('ai_explanation', params.ai_explanation);
    url.searchParams.set('vibe', params.vibe || 'casual');

    const res = await fetch(url.toString(), { method: 'POST' });
    if (!res.ok) throw new Error('Failed to log outfit');
  },

  async getHistory(): Promise<OutfitHistoryItem[]> {
    const res = await fetch(`${API_BASE}/outfit/history`);
    if (!res.ok) throw new Error('Failed to fetch outfit history');
    return res.json();
  }
};
