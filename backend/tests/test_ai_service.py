import pytest
from app.models import ClothingItem
from app.schemas import WeatherSummary
from app.services.ai_service import algorithmic_outfit_matching

def test_algorithmic_matching_cold_weather():
    top_warm = ClothingItem(id=1, category="top", name="Schwerer Strickpullover", warmth_level=5, color="dunkelblau", formality="casual")
    top_light = ClothingItem(id=2, category="top", name="Leinen-Top", warmth_level=1, color="weiß", formality="casual")

    pants_warm = ClothingItem(id=3, category="pants", name="Gefütterte Cordhose", warmth_level=5, color="braun", formality="casual")
    pants_light = ClothingItem(id=4, category="pants", name="Baumwoll-Shorts", warmth_level=1, color="beige", formality="casual")

    shoes_warm = ClothingItem(id=5, category="shoes", name="Winterstiefel", warmth_level=5, color="schwarz", waterproof=True, formality="casual")
    shoes_light = ClothingItem(id=6, category="shoes", name="Sandalen", warmth_level=1, color="tan", waterproof=False, formality="casual")

    weather_cold = WeatherSummary(
        temperature=2.0,
        apparent_temperature=-1.0,
        precipitation=0.5,
        weather_code=71,
        is_snowy=True,
        comfort_target=5,
        city="München"
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
    assert "wärme" in result["explanation"].lower() or "kalt" in result["explanation"].lower() or "kühl" in result["explanation"].lower()

def test_algorithmic_matching_hot_weather():
    top_warm = ClothingItem(id=1, category="top", name="Schwerer Strickpullover", warmth_level=5, color="dunkelblau", formality="casual")
    top_light = ClothingItem(id=2, category="top", name="Leinenhemd", warmth_level=1, color="weiß", formality="casual")

    pants_warm = ClothingItem(id=3, category="pants", name="Gefütterte Cordhose", warmth_level=5, color="braun", formality="casual")
    pants_light = ClothingItem(id=4, category="pants", name="Leinen-Shorts", warmth_level=1, color="beige", formality="casual")

    shoes_warm = ClothingItem(id=5, category="shoes", name="Winterstiefel", warmth_level=5, color="schwarz", formality="casual")
    shoes_light = ClothingItem(id=6, category="shoes", name="Espadrilles", warmth_level=1, color="tan", formality="casual")

    weather_hot = WeatherSummary(
        temperature=31.0,
        apparent_temperature=33.0,
        precipitation=0.0,
        weather_code=0,
        comfort_target=1,
        city="Rom"
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
