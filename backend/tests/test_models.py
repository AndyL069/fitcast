import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import ClothingItem, OutfitHistory

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_create_clothing_item(db_session):
    item = ClothingItem(
        category="top",
        name="Grey Cashmere Sweater",
        image_url="/uploads/sweater.jpg",
        color="grey",
        pattern="solid",
        fabric="cashmere",
        warmth_level=4,
        formality="smart_casual",
        waterproof=False
    )
    db_session.add(item)
    db_session.commit()
    db_session.refresh(item)

    assert item.id is not None
    assert item.category == "top"
    assert item.warmth_level == 4

def test_create_outfit_history(db_session):
    top = ClothingItem(category="top", name="White T-Shirt", image_url="/uploads/tshirt.jpg", warmth_level=2)
    pants = ClothingItem(category="pants", name="Blue Jeans", image_url="/uploads/jeans.jpg", warmth_level=3)
    shoes = ClothingItem(category="shoes", name="White Sneakers", image_url="/uploads/sneakers.jpg", warmth_level=2)
    
    db_session.add_all([top, pants, shoes])
    db_session.commit()

    outfit = OutfitHistory(
        top_id=top.id,
        pants_id=pants.id,
        shoes_id=shoes.id,
        weather_data='{"temp": 22.5, "condition": "Sunny"}',
        ai_explanation="Light breathable top with jeans for mild sunny weather.",
        vibe="casual"
    )
    db_session.add(outfit)
    db_session.commit()
    db_session.refresh(outfit)

    assert outfit.id is not None
    assert outfit.top_id == top.id
    assert outfit.top.name == "White T-Shirt"
