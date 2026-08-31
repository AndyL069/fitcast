from typing import Dict, Any, List
import httpx

# WMO Weather interpretation codes (WW)
WMO_CODES = {
    0: ("Clear sky", False, False),
    1: ("Mainly clear", False, False),
    2: ("Partly cloudy", False, False),
    3: ("Overcast", False, False),
    45: ("Fog", False, False),
    48: ("Depositing rime fog", False, False),
    51: ("Light drizzle", True, False),
    53: ("Moderate drizzle", True, False),
    55: ("Dense drizzle", True, False),
    61: ("Slight rain", True, False),
    63: ("Moderate rain", True, False),
    65: ("Heavy rain", True, False),
    71: ("Slight snow fall", False, True),
    73: ("Moderate snow fall", False, True),
    75: ("Heavy snow fall", False, True),
    77: ("Snow grains", False, True),
    80: ("Slight rain showers", True, False),
    81: ("Moderate rain showers", True, False),
    82: ("Violent rain showers", True, False),
    85: ("Slight snow showers", False, True),
    86: ("Heavy snow showers", False, True),
    95: ("Thunderstorm", True, False),
    96: ("Thunderstorm with slight hail", True, True),
    99: ("Thunderstorm with heavy hail", True, True),
}

def parse_weather_condition(code: int) -> Dict[str, Any]:
    if code in WMO_CODES:
        label, is_rainy, is_snowy = WMO_CODES[code]
    else:
        label, is_rainy, is_snowy = ("Cloudy", False, False)
    return {
        "condition": label,
        "is_rainy": is_rainy,
        "is_snowy": is_snowy
    }

def calculate_comfort_target(temp: float, apparent_temp: float) -> int:
    """
    Calculates target warmth rating (1 to 5) for clothing selection based on apparent temperature.
    1: Hot (>26C / >78F)
    2: Warm / Mild (20-25C / 68-77F)
    3: Moderate (13-19C / 55-67F)
    4: Cool (6-12C / 42-54F)
    5: Cold / Freezing (<6C / <42F)
    """
    effective_temp = apparent_temp if apparent_temp is not None else temp
    if effective_temp > 25.5:
        return 1
    elif effective_temp >= 19.5:
        return 2
    elif effective_temp >= 12.5:
        return 3
    elif effective_temp >= 5.5:
        return 4
    else:
        return 5

async def fetch_weather_for_coords(lat: float, lon: float) -> Dict[str, Any]:
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m",
        "hourly": "temperature_2m,precipitation_probability,weather_code",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_probability_max",
        "timezone": "auto"
    }

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    current = data.get("current", {})
    temp = current.get("temperature_2m", 20.0)
    apparent_temp = current.get("apparent_temperature", temp)
    precip = current.get("precipitation", 0.0)
    weather_code = current.get("weather_code", 0)
    wind_speed = current.get("wind_speed_10m", 0.0)

    cond_info = parse_weather_condition(weather_code)
    comfort_target = calculate_comfort_target(temp, apparent_temp)

    # Daily highs/lows
    daily = data.get("daily", {})
    temp_max = daily.get("temperature_2m_max", [temp])[0] if daily.get("temperature_2m_max") else temp
    temp_min = daily.get("temperature_2m_min", [temp])[0] if daily.get("temperature_2m_min") else temp
    precip_prob_max = daily.get("precipitation_probability_max", [0])[0] if daily.get("precipitation_probability_max") else 0

    return {
        "temperature": temp,
        "apparent_temperature": apparent_temp,
        "temp_max": temp_max,
        "temp_min": temp_min,
        "precipitation": precip,
        "precipitation_probability": precip_prob_max,
        "weather_code": weather_code,
        "condition": cond_info["condition"],
        "is_rainy": cond_info["is_rainy"] or precip > 0.1,
        "is_snowy": cond_info["is_snowy"],
        "wind_speed": wind_speed,
        "comfort_target": comfort_target
    }

async def search_city_geocoding(query: str) -> List[Dict[str, Any]]:
    url = "https://geocoding-api.open-meteo.com/v1/search"
    params = {"name": query, "count": 5, "language": "en", "format": "json"}

    async with httpx.AsyncClient(timeout=8.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    results = []
    for item in data.get("results", []):
        results.append({
            "name": item.get("name"),
            "country": item.get("country"),
            "admin1": item.get("admin1"),
            "latitude": item.get("latitude"),
            "longitude": item.get("longitude"),
            "display_name": f"{item.get('name')}, {item.get('admin1', '')} ({item.get('country', '')})"
        })
    return results
