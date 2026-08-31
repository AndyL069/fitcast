import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ClothingItem, OutfitHistory
from app.schemas import (
    OutfitRecommendRequest,
    OutfitRecommendResponse,
    ClothingItemResponse,
    WeatherSummary
)
from app.services.ai_service import generate_outfit_with_ai, analyze_clothing_image_with_ai

router = APIRouter(prefix="/api", tags=["outfit"])

@router.post("/outfit/recommend", response_model=OutfitRecommendResponse)
async def recommend_outfit(payload: OutfitRecommendRequest, db: Session = Depends(get_db)):
    tops = db.query(ClothingItem).filter(ClothingItem.category == "top").all()
    pants = db.query(ClothingItem).filter(ClothingItem.category == "pants").all()
    shoes = db.query(ClothingItem).filter(ClothingItem.category == "shoes").all()

    if not tops or not pants or not shoes:
        missing = []
        if not tops: missing.append("tops")
        if not pants: missing.append("pants")
        if not shoes: missing.append("shoes")
        raise HTTPException(
            status_code=400,
            detail=f"Please upload at least one item for each category. Missing: {', '.join(missing)}"
        )

    outfit_res = await generate_outfit_with_ai(
        tops=tops,
        pants=pants,
        shoes=shoes,
        weather=payload.weather,
        vibe=payload.vibe or "casual",
        locked_top_id=payload.locked_top_id,
        locked_pants_id=payload.locked_pants_id,
        locked_shoes_id=payload.locked_shoes_id
    )

    return OutfitRecommendResponse(
        top=ClothingItemResponse.model_validate(outfit_res["top"]),
        pants=ClothingItemResponse.model_validate(outfit_res["pants"]),
        shoes=ClothingItemResponse.model_validate(outfit_res["shoes"]),
        ai_explanation=outfit_res["explanation"],
        styling_tips=outfit_res.get("styling_tips", []),
        weather_fit_score=outfit_res.get("fit_score", 90)
    )

@router.post("/outfit/wear")
def log_worn_outfit(
    top_id: int,
    pants_id: int,
    shoes_id: int,
    weather_json: str,
    ai_explanation: str,
    vibe: str = "casual",
    db: Session = Depends(get_db)
):
    history = OutfitHistory(
        top_id=top_id,
        pants_id=pants_id,
        shoes_id=shoes_id,
        weather_data=weather_json,
        ai_explanation=ai_explanation,
        vibe=vibe
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return {"message": "Outfit saved to history", "id": history.id}

@router.get("/outfit/history")
def get_outfit_history(limit: int = 10, db: Session = Depends(get_db)):
    records = db.query(OutfitHistory).order_by(OutfitHistory.created_at.desc()).limit(limit).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "created_at": r.created_at,
            "top": ClothingItemResponse.model_validate(r.top) if r.top else None,
            "pants": ClothingItemResponse.model_validate(r.pants) if r.pants else None,
            "shoes": ClothingItemResponse.model_validate(r.shoes) if r.shoes else None,
            "weather": json.loads(r.weather_data) if r.weather_data else {},
            "ai_explanation": r.ai_explanation,
            "vibe": r.vibe
        })
    return results

@router.post("/items/analyze")
async def analyze_photo(image: UploadFile = File(...)):
    contents = await image.read()
    analysis = await analyze_clothing_image_with_ai(contents, image.filename or "item.jpg")
    return analysis

@router.post("/items/seed-sample-wardrobe")
def seed_sample_wardrobe(db: Session = Depends(get_db)):
    """Seeds a starter curated wardrobe with diverse tops, pants, and shoes."""
    sample_items = [
        # Tops
        ClothingItem(category="top", name="White Crewneck T-Shirt", image_url="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80", color="white", pattern="solid", fabric="cotton", warmth_level=2, formality="casual", waterproof=False),
        ClothingItem(category="top", name="Navy Merino Wool Sweater", image_url="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&auto=format&fit=crop&q=80", color="navy", pattern="solid", fabric="wool", warmth_level=4, formality="smart_casual", waterproof=False),
        ClothingItem(category="top", name="Olive Corduroy Overshirt", image_url="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=80", color="olive", pattern="solid", fabric="corduroy", warmth_level=3, formality="casual", waterproof=False),
        ClothingItem(category="top", name="Black Puffer Jacket", image_url="https://images.unsplash.com/photo-1544923246-77307dd654cb?w=500&auto=format&fit=crop&q=80", color="black", pattern="solid", fabric="synthetic", warmth_level=5, formality="casual", waterproof=True),
        ClothingItem(category="top", name="Linen Striped Button-Down", image_url="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&auto=format&fit=crop&q=80", color="beige", pattern="striped", fabric="linen", warmth_level=1, formality="smart_casual", waterproof=False),

        # Pants
        ClothingItem(category="pants", name="Classic Slim Denim Jeans", image_url="https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop&q=80", color="blue", pattern="solid", fabric="denim", warmth_level=3, formality="casual", waterproof=False),
        ClothingItem(category="pants", name="Khaki Tailored Chinos", image_url="https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&auto=format&fit=crop&q=80", color="khaki", pattern="solid", fabric="cotton", warmth_level=3, formality="smart_casual", waterproof=False),
        ClothingItem(category="pants", name="Charcoal Wool Trousers", image_url="https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&auto=format&fit=crop&q=80", color="grey", pattern="solid", fabric="wool", warmth_level=4, formality="formal", waterproof=False),
        ClothingItem(category="pants", name="Breezy Linen Shorts", image_url="https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&auto=format&fit=crop&q=80", color="cream", pattern="solid", fabric="linen", warmth_level=1, formality="casual", waterproof=False),

        # Shoes
        ClothingItem(category="shoes", name="Minimalist White Leather Sneakers", image_url="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80", color="white", pattern="solid", fabric="leather", warmth_level=2, formality="casual", waterproof=False),
        ClothingItem(category="shoes", name="Dark Brown Leather Chelsea Boots", image_url="https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500&auto=format&fit=crop&q=80", color="brown", pattern="solid", fabric="leather", warmth_level=4, formality="smart_casual", waterproof=True),
        ClothingItem(category="shoes", name="Black Oxford Dress Shoes", image_url="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500&auto=format&fit=crop&q=80", color="black", pattern="solid", fabric="leather", warmth_level=3, formality="formal", waterproof=True),
        ClothingItem(category="shoes", name="Casual Suede Loafers", image_url="https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&auto=format&fit=crop&q=80", color="tan", pattern="solid", fabric="leather", warmth_level=2, formality="smart_casual", waterproof=False),
    ]

    # Clear existing demo placeholders or add if empty
    for item in sample_items:
        db.add(item)
    db.commit()
    return {"message": "Sample wardrobe seeded successfully!", "count": len(sample_items)}
