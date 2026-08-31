from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ClothingItemBase(BaseModel):
    category: str = Field(..., description="'top', 'pants', or 'shoes'")
    name: str = Field(..., description="Descriptive name")
    color: str = "neutral"
    secondary_colors: Optional[str] = "[]"
    pattern: str = "solid"
    fabric: str = "cotton"
    warmth_level: int = Field(3, ge=1, le=5, description="1 (coolest) to 5 (warmest)")
    formality: str = "casual"
    waterproof: bool = False

class ClothingItemCreate(ClothingItemBase):
    image_url: str

class ClothingItemUpdate(BaseModel):
    category: Optional[str] = None
    name: Optional[str] = None
    color: Optional[str] = None
    pattern: Optional[str] = None
    fabric: Optional[str] = None
    warmth_level: Optional[int] = None
    formality: Optional[str] = None
    waterproof: Optional[bool] = None

class ClothingItemResponse(ClothingItemBase):
    id: int
    image_url: str
    created_at: datetime

    class Config:
        from_attributes = True

class WeatherSummary(BaseModel):
    temperature: float
    apparent_temperature: float
    precipitation: float
    weather_code: int
    is_rainy: bool = False
    is_snowy: bool = False
    comfort_target: int = 3
    city: Optional[str] = "Your Location"

class OutfitRecommendRequest(BaseModel):
    weather: WeatherSummary
    vibe: Optional[str] = "casual"
    locked_top_id: Optional[int] = None
    locked_pants_id: Optional[int] = None
    locked_shoes_id: Optional[int] = None

class OutfitRecommendResponse(BaseModel):
    top: ClothingItemResponse
    pants: ClothingItemResponse
    shoes: ClothingItemResponse
    ai_explanation: str
    styling_tips: Optional[List[str]] = []
    weather_fit_score: int = Field(90, ge=0, le=100)
