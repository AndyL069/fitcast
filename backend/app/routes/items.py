import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import ClothingItem, User
from app.schemas import ClothingItemResponse, ClothingItemUpdate
from app.config import settings
from app.routes.auth import get_optional_user

router = APIRouter(prefix="/api/items", tags=["items"])

@router.get("", response_model=List[ClothingItemResponse])
def list_items(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(ClothingItem)
    if current_user:
        query = query.filter(ClothingItem.user_id == current_user.id)
    else:
        query = query.filter(ClothingItem.user_id == None)

    if category:
        query = query.filter(ClothingItem.category == category.lower())
    return query.order_by(ClothingItem.created_at.desc()).all()

@router.get("/{item_id}", response_model=ClothingItemResponse)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(ClothingItem).filter(ClothingItem.id == item_id)
    if current_user:
        query = query.filter(ClothingItem.user_id == current_user.id)
    item = query.first()
    if not item:
        raise HTTPException(status_code=404, detail="Kleidungsstück nicht gefunden.")
    return item

@router.post("", response_model=ClothingItemResponse)
async def create_item(
    category: str = Form(...),
    name: str = Form(...),
    color: str = Form("neutral"),
    pattern: str = Form("einfarbig"),
    fabric: str = Form("Baumwolle"),
    warmth_level: int = Form(3),
    formality: str = Form("casual"),
    waterproof: str = Form("false"),
    image: Optional[UploadFile] = File(None),
    image_url_override: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    final_image_url = image_url_override or "/uploads/placeholder.jpg"

    if image and image.filename:
        ext = Path(image.filename).suffix or ".jpg"
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        target_path = settings.UPLOADS_DIR / unique_filename
        
        contents = await image.read()
        with open(target_path, "wb") as f:
            f.write(contents)
        
        final_image_url = f"/uploads/{unique_filename}"

    is_waterproof = waterproof.lower() in ("true", "1", "yes")

    db_item = ClothingItem(
        user_id=current_user.id if current_user else None,
        category=category.lower(),
        name=name,
        image_url=final_image_url,
        color=color.lower(),
        pattern=pattern.lower(),
        fabric=fabric.lower(),
        warmth_level=warmth_level,
        formality=formality.lower(),
        waterproof=is_waterproof
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{item_id}", response_model=ClothingItemResponse)
def update_item(
    item_id: int,
    item_update: ClothingItemUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(ClothingItem).filter(ClothingItem.id == item_id)
    if current_user:
        query = query.filter(ClothingItem.user_id == current_user.id)
    db_item = query.first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Kleidungsstück nicht gefunden.")
    
    update_data = item_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    query = db.query(ClothingItem).filter(ClothingItem.id == item_id)
    if current_user:
        query = query.filter(ClothingItem.user_id == current_user.id)
    db_item = query.first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Kleidungsstück nicht gefunden.")
    
    # Clean up local image if not placeholder
    if db_item.image_url.startswith("/uploads/") and "placeholder" not in db_item.image_url:
        filename = db_item.image_url.replace("/uploads/", "")
        file_path = settings.UPLOADS_DIR / filename
        if file_path.exists() and file_path.is_file():
            try:
                file_path.unlink()
            except Exception:
                pass

    db.delete(db_item)
    db.commit()
    return {"message": "Kleidungsstück erfolgreich gelöscht.", "id": item_id}
