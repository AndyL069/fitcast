export type CategoryType = 'top' | 'pants' | 'shoes';

export interface ClothingItem {
  id: number;
  category: CategoryType;
  name: string;
  image_url: string;
  color: string;
  secondary_colors?: string;
  pattern: string;
  fabric: string;
  warmth_level: number; // 1 to 5
  formality: string;
  waterproof: boolean;
  created_at: string;
}

export interface WeatherData {
  temperature: number;
  apparent_temperature: number;
  temp_max?: number;
  temp_min?: number;
  precipitation: number;
  precipitation_probability?: number;
  weather_code: number;
  condition: string;
  is_rainy: boolean;
  is_snowy: boolean;
  wind_speed?: number;
  comfort_target: number;
  city?: string;
}

export interface CitySearchResult {
  name: string;
  country?: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  display_name: string;
}

export interface OutfitRecommendation {
  top: ClothingItem;
  pants: ClothingItem;
  shoes: ClothingItem;
  ai_explanation: string;
  styling_tips: string[];
  weather_fit_score: number;
}

export interface OutfitHistoryItem {
  id: number;
  created_at: string;
  top: ClothingItem | null;
  pants: ClothingItem | null;
  shoes: ClothingItem | null;
  weather: WeatherData;
  ai_explanation: string;
  vibe: string;
}

export type VibeType = 'casual' | 'smart_casual' | 'formal' | 'athletic' | 'all';
