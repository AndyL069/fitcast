import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ClothingItem, OutfitHistory, User
from app.schemas import (
    OutfitRecommendRequest,
    OutfitRecommendResponse,
    ClothingItemResponse,
    WeatherSummary
)
from app.services.ai_service import generate_outfit_with_ai, analyze_clothing_image_with_ai
from app.routes.auth import get_optional_user

router = APIRouter(prefix="/api", tags=["outfit"])

@router.post("/outfit/recommend", response_model=OutfitRecommendResponse)
async def recommend_outfit(
    payload: OutfitRecommendRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query_top = db.query(ClothingItem).filter(ClothingItem.category == "top")
    query_pants = db.query(ClothingItem).filter(ClothingItem.category == "pants")
    query_shoes = db.query(ClothingItem).filter(ClothingItem.category == "shoes")
    query_jackets = db.query(ClothingItem).filter(ClothingItem.category == "jacket")

    if current_user:
        query_top = query_top.filter(ClothingItem.user_id == current_user.id)
        query_pants = query_pants.filter(ClothingItem.user_id == current_user.id)
        query_shoes = query_shoes.filter(ClothingItem.user_id == current_user.id)
        query_jackets = query_jackets.filter(ClothingItem.user_id == current_user.id)
    else:
        query_top = query_top.filter(ClothingItem.user_id == None)
        query_pants = query_pants.filter(ClothingItem.user_id == None)
        query_shoes = query_shoes.filter(ClothingItem.user_id == None)
        query_jackets = query_jackets.filter(ClothingItem.user_id == None)

    tops = query_top.all()
    pants = query_pants.all()
    shoes = query_shoes.all()
    jackets = query_jackets.all()

    if not tops or not pants or not shoes:
        missing = []
        if not tops: missing.append("Oberteile")
        if not pants: missing.append("Hosen")
        if not shoes: missing.append("Schuhe")
        raise HTTPException(
            status_code=400,
            detail=f"Bitte lade mindestens ein Kleidungsstück pro Kategorie hoch. Es fehlen: {', '.join(missing)}"
        )

    outfit_res = await generate_outfit_with_ai(
        tops=tops,
        pants=pants,
        shoes=shoes,
        jackets=jackets,
        weather=payload.weather,
        vibe=payload.vibe or "casual",
        locked_top_id=payload.locked_top_id,
        locked_pants_id=payload.locked_pants_id,
        locked_shoes_id=payload.locked_shoes_id,
        locked_jacket_id=payload.locked_jacket_id
    )

    return OutfitRecommendResponse(
        top=ClothingItemResponse.model_validate(outfit_res["top"]),
        pants=ClothingItemResponse.model_validate(outfit_res["pants"]),
        shoes=ClothingItemResponse.model_validate(outfit_res["shoes"]),
        jacket=ClothingItemResponse.model_validate(outfit_res["jacket"]) if outfit_res.get("jacket") else None,
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
    jacket_id: Optional[int] = None,
    vibe: str = "casual",
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    history = OutfitHistory(
        user_id=current_user.id if current_user else None,
        top_id=top_id,
        pants_id=pants_id,
        shoes_id=shoes_id,
        jacket_id=jacket_id,
        weather_data=weather_json,
        ai_explanation=ai_explanation,
        vibe=vibe
    )
    db.add(history)
    db.commit()
    db.refresh(history)
    return {"message": "Outfit erfolgreich im Verlauf gespeichert", "id": history.id}

@router.delete("/outfit/history/{history_id}")
def delete_history_entry(
    history_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    entry = db.query(OutfitHistory).filter(OutfitHistory.id == history_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Verlaufseintrag nicht gefunden")
    # Ownership check
    if current_user and entry.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    if not current_user and entry.user_id is not None:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    db.delete(entry)
    db.commit()
    return {"message": "Verlaufseintrag gelöscht"}

@router.get("/outfit/history")
def get_outfit_history(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(OutfitHistory)
    if current_user:
        query = query.filter(OutfitHistory.user_id == current_user.id)
    else:
        query = query.filter(OutfitHistory.user_id == None)

    records = query.order_by(OutfitHistory.created_at.desc()).limit(limit).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "created_at": r.created_at,
            "top": ClothingItemResponse.model_validate(r.top) if r.top else None,
            "pants": ClothingItemResponse.model_validate(r.pants) if r.pants else None,
            "shoes": ClothingItemResponse.model_validate(r.shoes) if r.shoes else None,
            "jacket": ClothingItemResponse.model_validate(r.jacket) if r.jacket else None,
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
def seed_sample_wardrobe(
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """Erstellt eine kuratierte Beispiel-Garderobe mit Oberteilen, Hosen, Schuhen und Jacken."""
    uid = current_user.id if current_user else None
    sample_items = [
        # Oberteile
        ClothingItem(user_id=uid, category="top", name="Weißes Rundhals T-Shirt", image_url="https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=80", color="Weiß", pattern="einfarbig", fabric="Baumwolle", warmth_level=2, formality="casual", waterproof=False),
        ClothingItem(user_id=uid, category="top", name="Dunkelblauer Merinowoll-Pullover", image_url="https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=500&auto=format&fit=crop&q=80", color="Dunkelblau", pattern="einfarbig", fabric="Wolle", warmth_level=4, formality="smart_casual", waterproof=False),
        ClothingItem(user_id=uid, category="top", name="Olivgrünes Cord-Overshirt", image_url="https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&auto=format&fit=crop&q=80", color="Olivgrün", pattern="einfarbig", fabric="Cord", warmth_level=3, formality="casual", waterproof=False),
        ClothingItem(user_id=uid, category="top", name="Gestreiftes Leinenhemd", image_url="https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&auto=format&fit=crop&q=80", color="Beige", pattern="gestreift", fabric="Leinen", warmth_level=1, formality="smart_casual", waterproof=False),

        # Jacken & Mäntel
        ClothingItem(user_id=uid, category="jacket", name="Schwarze Stepp-Winterjacke", image_url="https://images.unsplash.com/photo-1544923246-77307dd654cb?w=500&auto=format&fit=crop&q=80", color="Schwarz", pattern="einfarbig", fabric="Synthetik", warmth_level=5, formality="casual", waterproof=True),
        ClothingItem(user_id=uid, category="jacket", name="Klassischer beiger Trenchcoat", image_url="https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&auto=format&fit=crop&q=80", color="Beige", pattern="einfarbig", fabric="Baumwolle", warmth_level=3, formality="smart_casual", waterproof=True),
        ClothingItem(user_id=uid, category="jacket", name="Dunkelblaue Jeansjacke", image_url="https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=500&auto=format&fit=crop&q=80", color="Dunkelblau", pattern="einfarbig", fabric="Denim", warmth_level=3, formality="casual", waterproof=False),

        # Hosen
        ClothingItem(user_id=uid, category="pants", name="Klassische Slim-Fit Jeans", image_url="https://images.unsplash.com/photo-1542272604-780c96856592?w=500&auto=format&fit=crop&q=80", color="Blau", pattern="einfarbig", fabric="Denim", warmth_level=3, formality="casual", waterproof=False),
        ClothingItem(user_id=uid, category="pants", name="Khaki Chino-Hose", image_url="https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&auto=format&fit=crop&q=80", color="Khaki", pattern="einfarbig", fabric="Baumwolle", warmth_level=3, formality="smart_casual", waterproof=False),
        ClothingItem(user_id=uid, category="pants", name="Anthrazitgraue Woll-Anzughose", image_url="https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=500&auto=format&fit=crop&q=80", color="Grau", pattern="einfarbig", fabric="Wolle", warmth_level=4, formality="formal", waterproof=False),
        ClothingItem(user_id=uid, category="pants", name="Leichte Leinen-Shorts", image_url="https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&auto=format&fit=crop&q=80", color="Creme", pattern="einfarbig", fabric="Leinen", warmth_level=1, formality="casual", waterproof=False),

        # Schuhe
        ClothingItem(user_id=uid, category="shoes", name="Minimalistische weiße Ledersneaker", image_url="https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&auto=format&fit=crop&q=80", color="Weiß", pattern="einfarbig", fabric="Leder", warmth_level=2, formality="casual", waterproof=False),
        ClothingItem(user_id=uid, category="shoes", name="Dunkelbraune Chelsea-Lederstiefel", image_url="https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500&auto=format&fit=crop&q=80", color="Braun", pattern="einfarbig", fabric="Leder", warmth_level=4, formality="smart_casual", waterproof=True),
        ClothingItem(user_id=uid, category="shoes", name="Klassische schwarze Oxford-Schuhe", image_url="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500&auto=format&fit=crop&q=80", color="Schwarz", pattern="einfarbig", fabric="Leder", warmth_level=3, formality="formal", waterproof=True),
        ClothingItem(user_id=uid, category="shoes", name="Bequeme Veloursleder-Loafer", image_url="https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&auto=format&fit=crop&q=80", color="Tan", pattern="einfarbig", fabric="Leder", warmth_level=2, formality="smart_casual", waterproof=False),
    ]

    for item in sample_items:
        db.add(item)
    db.commit()
    return {"message": "Beispiel-Garderobe erfolgreich geladen!", "count": len(sample_items)}
