from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr

# ============================
# User / Auth Schemas
# ============================
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    auth_provider: str
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProvidersResponse(BaseModel):
    authentik_enabled: bool

# ============================
# Clothing Item Schemas
# ============================
class ClothingItemBase(BaseModel):
    category: str  # top, pants, shoes, jacket
    name: str
    color: Optional[str] = "neutral"
    secondary_colors: Optional[str] = "[]"
    pattern: Optional[str] = "einfarbig"
    fabric: Optional[str] = "Baumwolle"
    warmth_level: Optional[int] = 3
    formality: Optional[str] = "casual"
    waterproof: Optional[bool] = False

class ClothingItemCreate(ClothingItemBase):
    pass

class ClothingItemUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    color: Optional[str] = None
    secondary_colors: Optional[str] = None
    pattern: Optional[str] = None
    fabric: Optional[str] = None
    warmth_level: Optional[int] = None
    formality: Optional[str] = None
    waterproof: Optional[bool] = None

class ClothingItemResponse(ClothingItemBase):
    id: int
    user_id: Optional[int] = None
    image_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ============================
# Weather & Outfit Schemas
# ============================
class WeatherSummary(BaseModel):
    temperature: float
    apparent_temperature: Optional[float] = None
    temp_max: Optional[float] = None
    temp_min: Optional[float] = None
    precipitation: float = 0.0
    precipitation_probability: Optional[float] = 0.0
    weather_code: int = 0
    condition: Optional[str] = "Klar"
    is_rainy: bool = False
    is_snowy: bool = False
    wind_speed: Optional[float] = 0.0
    comfort_target: int = 3
    city: Optional[str] = "Berlin"

class OutfitRecommendRequest(BaseModel):
    weather: WeatherSummary
    vibe: Optional[str] = "casual"
    include_jacket: bool = False
    locked_top_id: Optional[int] = None
    locked_pants_id: Optional[int] = None
    locked_shoes_id: Optional[int] = None
    locked_jacket_id: Optional[int] = None

class OutfitRecommendResponse(BaseModel):
    top: ClothingItemResponse
    pants: ClothingItemResponse
    shoes: ClothingItemResponse
    jacket: Optional[ClothingItemResponse] = None
    ai_explanation: str
    styling_tips: List[str]
    weather_fit_score: int
