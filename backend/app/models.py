from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class ClothingItem(Base):
    __tablename__ = "clothing_items"

    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(20), nullable=False, index=True)  # top, pants, shoes
    name = Column(String(100), nullable=False)
    image_url = Column(String(255), nullable=False)
    color = Column(String(50), default="neutral")
    secondary_colors = Column(String(255), default="[]")
    pattern = Column(String(50), default="solid")
    fabric = Column(String(50), default="cotton")
    warmth_level = Column(Integer, default=3)  # 1 to 5
    formality = Column(String(50), default="casual")  # casual, smart_casual, formal, athletic
    waterproof = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

class OutfitHistory(Base):
    __tablename__ = "outfit_history"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=utc_now)
    top_id = Column(Integer, ForeignKey("clothing_items.id"), nullable=False)
    pants_id = Column(Integer, ForeignKey("clothing_items.id"), nullable=False)
    shoes_id = Column(Integer, ForeignKey("clothing_items.id"), nullable=False)
    weather_data = Column(Text, nullable=False)  # JSON string
    ai_explanation = Column(Text, nullable=False)
    vibe = Column(String(50), default="casual")

    top = relationship("ClothingItem", foreign_keys=[top_id])
    pants = relationship("ClothingItem", foreign_keys=[pants_id])
    shoes = relationship("ClothingItem", foreign_keys=[shoes_id])
