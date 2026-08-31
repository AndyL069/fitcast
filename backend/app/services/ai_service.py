import json
import random
from typing import List, Dict, Any, Optional
from app.config import settings
from app.models import ClothingItem
from app.schemas import WeatherSummary

NEUTRALS = {
    "white", "weiß", "black", "schwarz", "grey", "gray", "grau", "navy", "dunkelblau", 
    "beige", "cream", "creme", "khaki", "brown", "braun", "tan", "denim", "neutral"
}

def calculate_color_score(top_color: str, pants_color: str, shoes_color: str) -> float:
    t, p, s = top_color.lower(), pants_color.lower(), shoes_color.lower()
    score = 10.0

    if t == p == s and t not in NEUTRALS:
        score -= 4.0

    if t == p == s and t in {"black", "schwarz", "navy", "dunkelblau", "grey", "grau", "beige"}:
        score += 3.0

    if p in NEUTRALS:
        score += 2.0

    if s in NEUTRALS or s == t:
        score += 2.0

    return score

def algorithmic_outfit_matching(
    tops: List[ClothingItem],
    pants: List[ClothingItem],
    shoes: List[ClothingItem],
    weather: WeatherSummary,
    vibe: str = "casual",
    locked_top_id: Optional[int] = None,
    locked_pants_id: Optional[int] = None,
    locked_shoes_id: Optional[int] = None
) -> Dict[str, Any]:
    target_warmth = weather.comfort_target
    target_vibe = vibe.lower() if vibe else "casual"

    cand_tops = [t for t in tops if t.id == locked_top_id] if locked_top_id else tops
    cand_pants = [p for p in pants if p.id == locked_pants_id] if locked_pants_id else pants
    cand_shoes = [s for s in shoes if s.id == locked_shoes_id] if locked_shoes_id else shoes

    if not cand_tops: cand_tops = tops
    if not cand_pants: cand_pants = pants
    if not cand_shoes: cand_shoes = shoes

    best_combination = None
    highest_score = -9999.0

    for top in cand_tops:
        for pant in cand_pants:
            for shoe in cand_shoes:
                score = 50.0

                top_diff = abs(top.warmth_level - target_warmth)
                pant_diff = abs(pant.warmth_level - target_warmth)
                shoe_diff = abs(shoe.warmth_level - target_warmth)
                thermal_penalty = (top_diff * 4.0) + (pant_diff * 3.0) + (shoe_diff * 2.0)
                score -= thermal_penalty

                if weather.is_rainy or weather.is_snowy:
                    if shoe.waterproof:
                        score += 15.0
                    else:
                        score -= 8.0
                    if top.waterproof:
                        score += 8.0

                if target_vibe != "all":
                    if top.formality == target_vibe:
                        score += 4.0
                    if pant.formality == target_vibe:
                        score += 4.0
                    if shoe.formality == target_vibe:
                        score += 4.0

                if (shoe.formality == "formal" and pant.formality in ("athletic", "lounge")) or \
                   (top.formality == "formal" and pant.formality == "athletic"):
                    score -= 15.0

                score += calculate_color_score(top.color, pant.color, shoe.color)
                jitter = random.uniform(0.0, 1.5)
                total_score = score + jitter

                if total_score > highest_score:
                    highest_score = total_score
                    best_combination = (top, pant, shoe)

    if not best_combination:
        best_combination = (tops[0], pants[0], shoes[0])

    sel_top, sel_pants, sel_shoes = best_combination

    temp_desc = f"{weather.temperature:.1f}°C"
    if weather.comfort_target >= 4:
        weather_note = f"Bei kühlen bis kalten Temperaturen ({temp_desc}) und einem Ziel-Wärmegrad von {weather.comfort_target}/5 ist die Kombination aus '{sel_top.name}' und '{sel_pants.name}' ideal für wohlige Wärme."
    elif weather.comfort_target <= 2:
        weather_note = f"Bei warmem Wetter ({temp_desc}) und Sonnenschein halten dich das leichte '{sel_top.name}' und '{sel_pants.name}' den ganzen Tag angenehm kühl."
    else:
        weather_note = f"Für das angenehme Wetter heute ({temp_desc}) bietet die ausgewogene Kombination aus '{sel_top.name}' und '{sel_pants.name}' optimalen Komfort."

    if (weather.is_rainy or weather.is_snowy) and sel_shoes.waterproof:
        weather_note += " Dank der wasserdichten Schuhe bleiben deine Füße zudem trocken."

    color_note = f"Die Farbharmonie ({sel_top.color} zu {sel_pants.color} und {sel_shoes.color}) erzeugt einen stimmigen und modernen Look."

    explanation = f"{weather_note} {color_note}"
    styling_tips = [
        f"Kombiniere dezente Accessoires passend zu deinen {sel_shoes.color}en Schuhen.",
        "Ärmel oder Hosenbund bei Bedarf leicht hochkrempeln für eine entspannte Silhouette.",
        "Für den kühleren Abend empfiehlt sich eine leichte Übergangsjacke."
    ]

    fit_score = max(70, min(98, int(85 + (highest_score / 10))))

    return {
        "top": sel_top,
        "pants": sel_pants,
        "shoes": sel_shoes,
        "explanation": explanation,
        "styling_tips": styling_tips,
        "fit_score": fit_score
    }

async def analyze_clothing_image_with_ai(image_bytes: bytes, filename: str) -> Dict[str, Any]:
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = """Analysiere dieses Kleidungsstück-Foto.
Gib ein valides JSON-Objekt auf Deutsch zurück:
{
  "category": "top" | "pants" | "shoes",
  "name": "Beschreibender deutscher Titel (z.B. Dunkelblauer Wollpullover)",
  "color": "Farbe auf Deutsch (z.B. Dunkelblau, Weiß, Schwarz, Beige)",
  "pattern": "einfarbig | gestreift | kariert | gemustert",
  "fabric": "Baumwolle | Wolle | Denim | Leder | Leinen | Synthetik | Fleece",
  "warmth_level": 1 bis 5 (1=sehr leichtes Sommerteil/Shorts, 3=mittelschweres Shirt/Chino, 5=schwerer Wintermantel/Stiefel),
  "formality": "casual | smart_casual | formal | athletic | lounge",
  "waterproof": true oder false
}
Antworte NUR mit reinem JSON ohne Markdown-Codeblöcke."""

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt
                ]
            )
            text = response.text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.endswith("```"): text = text[:-3]
            parsed = json.loads(text.strip())
            return parsed
        except Exception as e:
            print(f"Gemini Vision API error: {e}")

    name_lower = filename.lower()
    if any(k in name_lower for k in ["pant", "jean", "hose", "chino", "short"]):
        cat = "pants"
        name = "Hose"
        warmth = 3
    elif any(k in name_lower for k in ["shoe", "schuh", "sneaker", "boot", "stiefel"]):
        cat = "shoes"
        name = "Schuhe"
        warmth = 2
    else:
        cat = "top"
        name = "Oberteil"
        warmth = 2

    return {
        "category": cat,
        "name": name,
        "color": "neutral",
        "pattern": "einfarbig",
        "fabric": "Baumwolle",
        "warmth_level": warmth,
        "formality": "casual",
        "waterproof": False
    }

async def generate_outfit_with_ai(
    tops: List[ClothingItem],
    pants: List[ClothingItem],
    shoes: List[ClothingItem],
    weather: WeatherSummary,
    vibe: str = "casual",
    locked_top_id: Optional[int] = None,
    locked_pants_id: Optional[int] = None,
    locked_shoes_id: Optional[int] = None
) -> Dict[str, Any]:
    if settings.GEMINI_API_KEY and len(tops) > 0 and len(pants) > 0 and len(shoes) > 0:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            top_catalog = [{"id": t.id, "name": t.name, "color": t.color, "warmth": t.warmth_level, "formality": t.formality} for t in tops]
            pants_catalog = [{"id": p.id, "name": p.name, "color": p.color, "warmth": p.warmth_level, "formality": p.formality} for p in pants]
            shoes_catalog = [{"id": s.id, "name": s.name, "color": s.color, "warmth": s.warmth_level, "formality": s.formality, "waterproof": s.waterproof} for s in shoes]

            prompt = f"""Du bist ein professioneller Personal Stylist.
Aktuelle Wettervorhersage:
- Ort: {weather.city}
- Temperatur: {weather.temperature}°C (Gefühlt: {weather.apparent_temperature}°C)
- Niederschlag: {weather.precipitation}mm, Regen: {weather.is_rainy}, Schnee: {weather.is_snowy}
- Ziel-Wärmegrad (1=sehr leicht, 5=Winter): {weather.comfort_target}
- Anlass/Vibe: {vibe}

Verfügbare Oberteile: {json.dumps(top_catalog)}
Verfügbare Hosen: {json.dumps(pants_catalog)}
Verfügbare Schuhe: {json.dumps(shoes_catalog)}
Festgesetztes Oberteil ID: {locked_top_id}
Festgesetzte Hose ID: {locked_pants_id}
Festgesetzte Schuhe ID: {locked_shoes_id}

Wähle die beste Kombination aus (1 Oberteil, 1 Hose, 1 Paar Schuhe).
Antworte auf DEUTSCH mit einem JSON-Objekt in diesem Schema:
{{
  "top_id": <int>,
  "pants_id": <int>,
  "shoes_id": <int>,
  "explanation": "<2-3 ansprechende Sätze auf Deutsch, warum dieses Outfit modisch ist und perfekt zum heutigen Wetter passt>",
  "styling_tips": ["<Tipp 1 auf Deutsch>", "<Tipp 2 auf Deutsch>"],
  "weather_fit_score": <int zwischen 80 und 99>
}}"""

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            text = response.text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.endswith("```"): text = text[:-3]
            parsed = json.loads(text.strip())
            
            sel_top = next((t for t in tops if t.id == parsed["top_id"]), tops[0])
            sel_pants = next((p for p in pants if p.id == parsed["pants_id"]), pants[0])
            sel_shoes = next((s for s in shoes if s.id == parsed["shoes_id"]), shoes[0])

            return {
                "top": sel_top,
                "pants": sel_pants,
                "shoes": sel_shoes,
                "explanation": parsed.get("explanation", "Hervorragende Outfit-Kombination für die heutige Wetterlage."),
                "styling_tips": parsed.get("styling_tips", ["Mit klassischen Accessoires kombinieren."]),
                "fit_score": parsed.get("weather_fit_score", 92)
            }
        except Exception as e:
            print(f"Gemini styling API error: {e}")

    return algorithmic_outfit_matching(
        tops=tops,
        pants=pants,
        shoes=shoes,
        weather=weather,
        vibe=vibe,
        locked_top_id=locked_top_id,
        locked_pants_id=locked_pants_id,
        locked_shoes_id=locked_shoes_id
    )
