import pytest
from app.services.weather_service import calculate_comfort_target, parse_weather_condition

def test_comfort_target_mapping():
    # Hot weather (>26C) -> Warmth 1
    assert calculate_comfort_target(30.0, 32.0) == 1
    # Warm / mild (20-25C) -> Warmth 2
    assert calculate_comfort_target(22.0, 23.0) == 2
    # Moderate (13-19C) -> Warmth 3
    assert calculate_comfort_target(16.0, 15.0) == 3
    # Cool (6-12C) -> Warmth 4
    assert calculate_comfort_target(8.0, 7.0) == 4
    # Cold (<6C) -> Warmth 5
    assert calculate_comfort_target(2.0, -1.0) == 5

def test_parse_weather_condition():
    # Code 0 = Klarer Himmel
    cond_clear = parse_weather_condition(0)
    assert "klar" in cond_clear["condition"].lower() or "himmel" in cond_clear["condition"].lower()
    assert cond_clear["is_rainy"] is False
    assert cond_clear["is_snowy"] is False

    # Code 61 = Leichter Regen
    cond_rain = parse_weather_condition(61)
    assert "regen" in cond_rain["condition"].lower()
    assert cond_rain["is_rainy"] is True

    # Code 71 = Leichter Schneefall
    cond_snow = parse_weather_condition(71)
    assert "schnee" in cond_snow["condition"].lower()
    assert cond_snow["is_snowy"] is True
