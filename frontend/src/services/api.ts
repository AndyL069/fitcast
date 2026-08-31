import { 
  ClothingItem, 
  WeatherData, 
  CitySearchResult, 
  OutfitRecommendation, 
  OutfitHistoryItem,
  User,
  ProvidersResponse
} from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async register(data: { email: string; username: string; password: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Registrierung fehlgeschlagen' }));
      throw new Error(error.detail || 'Registrierung fehlgeschlagen');
    }
    return res.json();
  },

  async login(data: { email: string; password: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Ungültige Anmeldedaten' }));
      throw new Error(error.detail || 'Ungültige Anmeldedaten');
    }
    return res.json();
  },

  async logout(): Promise<void> {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  },

  async getMe(): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include',
      });
      if (res.status === 401) return null;
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  },

  async getProviders(): Promise<ProvidersResponse> {
    try {
      const res = await fetch(`${API_BASE}/auth/providers`, {
        credentials: 'include',
      });
      if (!res.ok) return { authentik_enabled: false };
      return res.json();
    } catch {
      return { authentik_enabled: false };
    }
  },

  // Wardrobe Items
  async getItems(category?: string): Promise<ClothingItem[]> {
    const url = category ? `${API_BASE}/items?category=${category}` : `${API_BASE}/items`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Kleidung konnte nicht geladen werden');
    return res.json();
  },

  async uploadItem(formData: FormData): Promise<ClothingItem> {
    const res = await fetch(`${API_BASE}/items`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Kleidungsstück konnte nicht hochgeladen werden');
    return res.json();
  },

  async updateItem(id: number, data: Partial<ClothingItem>): Promise<ClothingItem> {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Kleidungsstück konnte nicht aktualisiert werden');
    return res.json();
  },

  async deleteItem(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/items/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Kleidungsstück konnte nicht gelöscht werden');
  },

  async analyzePhoto(file: File): Promise<Partial<ClothingItem>> {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${API_BASE}/items/analyze`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Fotoanalyse fehlgeschlagen');
    return res.json();
  },

  async seedSampleWardrobe(): Promise<{ count: number }> {
    const res = await fetch(`${API_BASE}/items/seed-sample-wardrobe`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Beispiel-Garderobe konnte nicht geladen werden');
    return res.json();
  },

  // Weather
  async getCurrentWeather(lat: number, lon: number, city?: string): Promise<WeatherData> {
    const url = `${API_BASE}/weather/current?lat=${lat}&lon=${lon}${city ? `&city=${encodeURIComponent(city)}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Wetterdaten konnten nicht geladen werden');
    return res.json();
  },

  async searchCity(query: string): Promise<CitySearchResult[]> {
    const res = await fetch(`${API_BASE}/weather/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Stadtsuche fehlgeschlagen');
    return res.json();
  },

  // Outfit Recommendations & History
  async recommendOutfit(params: {
    weather: WeatherData;
    vibe?: string;
    include_jacket?: boolean;
    locked_top_id?: number | null;
    locked_pants_id?: number | null;
    locked_shoes_id?: number | null;
    locked_jacket_id?: number | null;
  }): Promise<OutfitRecommendation> {
    const res = await fetch(`${API_BASE}/outfit/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Outfit-Empfehlung fehlgeschlagen' }));
      throw new Error(err.detail || 'Outfit-Empfehlung fehlgeschlagen');
    }
    return res.json();
  },

  async logWornOutfit(params: {
    top_id: number;
    pants_id: number;
    shoes_id: number;
    jacket_id?: number | null;
    weather: WeatherData;
    ai_explanation: string;
    vibe?: string;
  }): Promise<{ id: number }> {
    const queryParams: Record<string, string> = {
      top_id: String(params.top_id),
      pants_id: String(params.pants_id),
      shoes_id: String(params.shoes_id),
      weather_json: JSON.stringify(params.weather),
      ai_explanation: params.ai_explanation,
      vibe: params.vibe || 'casual',
    };
    if (params.jacket_id) {
      queryParams.jacket_id = String(params.jacket_id);
    }
    const query = new URLSearchParams(queryParams);
    const res = await fetch(`${API_BASE}/outfit/wear?${query.toString()}`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Outfit-Verlauf konnte nicht gespeichert werden');
    return res.json();
  },

  async getHistory(): Promise<OutfitHistoryItem[]> {
    const res = await fetch(`${API_BASE}/outfit/history`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Verlauf konnte nicht geladen werden');
    return res.json();
  },

  async deleteHistoryEntry(id: number): Promise<void> {
    const res = await fetch(`${API_BASE}/outfit/history/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Verlaufseintrag konnte nicht gelöscht werden');
  },
};
