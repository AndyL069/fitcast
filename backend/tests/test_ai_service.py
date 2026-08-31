import pytest
from app.models import ClothingItem
from app.schemas import WeatherSummary
from app.services.ai_service import algorithmic_outfit_matching

def test_algorithmic_matching_cold_weather():
    # Warm items
    top_warm = ClothingItem(id=1, category="top", name="Heavy Wool Knit", warmth_level=5, color="navy", formality="casual")
    top_light = ClothingItem(id=2, category="top", name="Linen Tank Top", warmth_level=1, color="white", formality="casual")

    pants_warm = ClothingItem(id=3, category="pants", name="Lined Corduroy Pants", warmth_level=5, color="brown", formality="casual")
    pants_light = ClothingItem(id=4, category="pants", name="Cotton Shorts", warmth_level=1, color="beige", formality="casual")

    shoes_warm = ClothingItem(id=5, category="shoes", name="Winter Boots", warmth_level=5, color="black", waterproof=True, formality="casual")
    shoes_light = ClothingItem(id=6, category="shoes", name="Sandals", warmth_level=1, color="tan", waterproof=False, formality="casual")

    weather_cold = WeatherSummary(
        temperature=2.0,
        apparent_temperature=-1.0,
        precipitation=0.5,
        weather_code=71,
        is_snowy=True,
        comfort_target=5,
        city="Munich"
    )

    result = algorithmic_outfit_matching(
        tops=[top_warm, top_light],
        pants=[pants_warm, pants_light],
        shoes=[shoes_warm, shoes_light],
        weather=weather_cold,
        vibe="casual"
    )

    assert result["top"].id == 1
    assert result["pants"].id == 3
    assert result["shoes"].id == 5
    assert "cold" in result["explanation"].lower() or "warmth" in result["explanation"].lower()

def test_algorithmic_matching_hot_weather():
    top_warm = ClothingItem(id=1, category="top", name="Heavy Wool Knit", warmth_level=5, color="navy", formality="casual")
    top_light = ClothingItem(id=2, category="top", name="Linen Shirt", warmth_level=1, color="white", formality="casual")

    pants_warm = ClothingItem(id=3, category="pants", name="Lined Corduroy Pants", warmth_level=5, color="brown", formality="casual")
    pants_light = ClothingItem(id=4, category="pants", name="Linen Shorts", warmth_level=1, color="beige", formality="casual")

    shoes_warm = ClothingItem(id=5, category="shoes", name="Winter Boots", warmth_level=5, color="black", formality="casual")
    shoes_light = ClothingItem(id=6, category="shoes", name="Canvas Espadrilles", warmth_level=1, color="tan", formality="casual")

    weather_hot = WeatherSummary(
        temperature=31.0,
        apparent_temperature=33.0,
        precipitation=0.0,
        weather_code=0,
        comfort_target=1,
        city="Rome"
    )

    result = algorithmic_outfit_matching(
        tops=[top_warm, top_light],
        pants=[pants_warm, pants_light],
        shoes=[shoes_warm, shoes_light],
        weather=weather_hot,
        vibe="casual"
    )

    assert result["top"].id == 2
    assert result["pants"].id == 4
    assert result["shoes"].id == 6
