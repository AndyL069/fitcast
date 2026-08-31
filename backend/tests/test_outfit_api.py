import pytest
from app.models import ClothingItem

def test_recommend_outfit_api(client, db_session):
    # Seed items directly
    top = ClothingItem(category="top", name="Wool Sweater", image_url="/uploads/top.jpg", warmth_level=4, color="grey")
    pants = ClothingItem(category="pants", name="Denim Jeans", image_url="/uploads/pants.jpg", warmth_level=3, color="blue")
    shoes = ClothingItem(category="shoes", name="Leather Chelsea Boots", image_url="/uploads/shoes.jpg", warmth_level=4, color="black")
    db_session.add_all([top, pants, shoes])
    db_session.commit()

    payload = {
        "weather": {
            "temperature": 10.0,
            "apparent_temperature": 8.0,
            "precipitation": 0.0,
            "weather_code": 2,
            "comfort_target": 4,
            "city": "Berlin"
        },
        "vibe": "casual"
    }

    response = client.post("/api/outfit/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["top"]["name"] == "Wool Sweater"
    assert data["pants"]["name"] == "Denim Jeans"
    assert data["shoes"]["name"] == "Leather Chelsea Boots"
    assert len(data["ai_explanation"]) > 0
