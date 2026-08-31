from fastapi import APIRouter, HTTPException, Query
from app.services.weather_service import fetch_weather_for_coords, search_city_geocoding

router = APIRouter(prefix="/api/weather", tags=["weather"])

@router.get("/current")
async def get_current_weather(
    lat: float = Query(52.52, description="Latitude"),
    lon: float = Query(13.405, description="Longitude"),
    city: str = Query("Your Location", description="City name")
):
    try:
        weather_data = await fetch_weather_for_coords(lat, lon)
        weather_data["city"] = city
        return weather_data
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to fetch weather: {str(e)}")

@router.get("/search")
async def search_city(q: str = Query(..., min_length=2, description="City search query")):
    try:
        results = await search_city_geocoding(q)
        return results
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to search location: {str(e)}")
