import json
import random
from typing import List, Dict, Any, Optional
from app.config import settings
from app.models import ClothingItem
from app.schemas import WeatherSummary

# Color harmony palettes for rule-based scoring
NEUTRALS = {"white", "black", "grey", "gray", "navy", "beige", "cream", "khaki", "brown", "tan", "denim"}

def calculate_color_score(top_color: str, pants_color: str, shoes_color: str) -> float:
    t, p, s = top_color.lower(), pants_color.lower(), shoes_color.lower()
    score = 10.0

    # If all items are identical non-neutral color (e.g. all red), penalize slightly for balance
    if t == p == s and t not in NEUTRALS:
        score -= 4.0

    # Monochromatic neutral (all black / all navy) looks great
    if t == p == s and t in {"black", "navy", "grey", "beige"}:
        score += 3.0

    # Neutral pants (jeans, chinos) go with almost any top
    if p in NEUTRALS:
        score += 2.0

    # Matching shoes to belt/top or neutral shoes
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

    # Filter by locked items if specified
    cand_tops = [t for t in tops if t.id == locked_top_id] if locked_top_id else tops
    cand_pants = [p for p in pants if p.id == locked_pants_id] if locked_pants_id else pants
    cand_shoes = [s for s in shoes if s.id == locked_shoes_id] if locked_shoes_id else shoes

    if not cand_tops:
        cand_tops = tops
    if not cand_pants:
        cand_pants = pants
    if not cand_shoes:
        cand_shoes = shoes

    best_combination = None
    highest_score = -9999.0

    # Evaluate each combination
    for top in cand_tops:
        for pant in cand_pants:
            for shoe in cand_shoes:
                score = 50.0

                # 1. Thermal comfort score (Penalize distance from target warmth)
                top_diff = abs(top.warmth_level - target_warmth)
                pant_diff = abs(pant.warmth_level - target_warmth)
                shoe_diff = abs(shoe.warmth_level - target_warmth)
                thermal_penalty = (top_diff * 4.0) + (pant_diff * 3.0) + (shoe_diff * 2.0)
                score -= thermal_penalty

                # 2. Rain & weather risk score
                if weather.is_rainy or weather.is_snowy:
                    if shoe.waterproof:
                        score += 15.0
                    else:
                        score -= 8.0
                    if top.waterproof:
                        score += 8.0

                # 3. Formality / Vibe alignment
                if target_vibe != "all":
                    if top.formality == target_vibe:
                        score += 4.0
                    if pant.formality == target_vibe:
                        score += 4.0
                    if shoe.formality == target_vibe:
                        score += 4.0

                # Avoid severe formality mismatch (e.g. formal shoes + athletic pants)
                if (shoe.formality == "formal" and pant.formality in ("athletic", "lounge")) or \
                   (top.formality == "formal" and pant.formality == "athletic"):
                    score -= 15.0

                # 4. Color harmony score
                score += calculate_color_score(top.color, pant.color, shoe.color)

                # Add a tiny random jitter so shuffling yields nice variations among high scorers
                jitter = random.uniform(0.0, 1.5)
                total_score = score + jitter

                if total_score > highest_score:
                    highest_score = total_score
                    best_combination = (top, pant, shoe)

    if not best_combination:
        best_combination = (tops[0], pants[0], shoes[0])

    sel_top, sel_pants, sel_shoes = best_combination

    # Build natural language stylist explanation
    temp_desc = f"{weather.temperature:.1f}°C"
    if weather.comfort_target >= 4:
        weather_note = f"With cool/cold temperatures ({temp_desc}) and a comfort target of {weather.comfort_target}/5, we selected your warm {sel_top.name} and {sel_pants.name} for optimal insulation."
    elif weather.comfort_target <= 2:
        weather_note = f"With warm temperatures ({temp_desc}) and sunny skies, your light {sel_top.name} and {sel_pants.name} will keep you cool and comfortable all day."
    else:
        weather_note = f"For today's pleasant {temp_desc} weather, this balanced pairing of {sel_top.name} with {sel_pants.name} gives you the perfect mid-weight comfort."

    if (weather.is_rainy or weather.is_snowy) and sel_shoes.waterproof:
        weather_note += " Plus, your waterproof footwear ensures your feet stay completely dry."

    color_note = f"The {sel_top.color} top pairs effortlessly with {sel_pants.color} bottoms and {sel_shoes.color} shoes for a cohesive, stylish {vibe} aesthetic."

    explanation = f"{weather_note} {color_note}"
    styling_tips = [
        f"Pair with subtle accessories matching your {sel_shoes.color} shoes.",
        "Roll sleeves or cuff ankles if you want a more relaxed silhouette.",
        "Add an extra lightweight layer if venturing out in the late evening."
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
    """
    Uses Gemini Vision if API key is provided, or falls back to intelligent filename/default inference.
    """
    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = """Analyze this clothing item photo.
Return a valid JSON object matching this schema:
{
  "category": "top" | "pants" | "shoes",
  "name": "Descriptive title (e.g. Navy Cable Knit Sweater)",
  "color": "primary color",
  "pattern": "solid | striped | plaid | floral | graphic | patterned",
  "fabric": "cotton | wool | denim | leather | linen | synthetic | fleece",
  "warmth_level": 1 to 5 (1=light summer tank/shorts, 3=medium shirt/chinos, 5=heavy winter parka/coat/boots),
  "formality": "casual | smart_casual | formal | athletic | lounge",
  "waterproof": true or false
}
Return ONLY valid JSON without markdown wrapping."""

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt
                ]
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            parsed = json.loads(text.strip())
            return parsed
        except Exception as e:
            print(f"Gemini Vision API error (falling back): {e}")

    # Heuristic fallback based on filename or defaults
    name_lower = filename.lower()
    if any(k in name_lower for k in ["pant", "jean", "trouser", "chino", "short", "skirt"]):
        cat = "pants"
        name = "Tailored Bottoms"
        warmth = 3
    elif any(k in name_lower for k in ["shoe", "sneaker", "boot", "loafer", "sandal", "heel"]):
        cat = "shoes"
        name = "Classic Footwear"
        warmth = 2
    else:
        cat = "top"
        name = "Casual Top"
        warmth = 2

    return {
        "category": cat,
        "name": name,
        "color": "neutral",
        "pattern": "solid",
        "fabric": "cotton",
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
    """
    Attempts AI Gemini styling with structured reasoning, or falls back to deterministic algorithmic matching.
    """
    if settings.GEMINI_API_KEY and len(tops) > 0 and len(pants) > 0 and len(shoes) > 0:
        try:
            from google import genai
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            top_catalog = [{"id": t.id, "name": t.name, "color": t.color, "warmth": t.warmth_level, "formality": t.formality} for t in tops]
            pants_catalog = [{"id": p.id, "name": p.name, "color": p.color, "warmth": p.warmth_level, "formality": p.formality} for p in pants]
            shoes_catalog = [{"id": s.id, "name": s.name, "color": s.color, "warmth": s.warmth_level, "formality": s.formality, "waterproof": s.waterproof} for s in shoes]

            prompt = f"""You are an expert personal stylist.
Current Weather Forecast:
- Location: {weather.city}
- Temperature: {weather.temperature}°C (Feels like: {weather.apparent_temperature}°C)
- Condition: {weather.precipitation}mm precip, Rainy: {weather.is_rainy}, Snowy: {weather.is_snowy}
- Target Warmth Level (1=hot, 5=freezing): {weather.comfort_target}
- Target Vibe: {vibe}

Available Tops: {json.dumps(top_catalog)}
Available Pants: {json.dumps(pants_catalog)}
Available Shoes: {json.dumps(shoes_catalog)}
Locked Top ID: {locked_top_id}
Locked Pants ID: {locked_pants_id}
Locked Shoes ID: {locked_shoes_id}

Select the single best combination of (1 Top, 1 Pant, 1 Shoe).
Respond ONLY with a JSON object in this exact schema:
{{
  "top_id": <int>,
  "pants_id": <int>,
  "shoes_id": <int>,
  "explanation": "<2-3 engaging sentences explaining why this outfit is stylish and perfectly suited for today's weather>",
  "styling_tips": ["<Tip 1>", "<Tip 2>"],
  "weather_fit_score": <int between 80 and 99>
}}"""

            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.endswith("```"):
                text = text[:-3]
            parsed = json.loads(text.strip())
            
            sel_top = next((t for t in tops if t.id == parsed["top_id"]), tops[0])
            sel_pants = next((p for p in pants if p.id == parsed["pants_id"]), pants[0])
            sel_shoes = next((s for s in shoes if s.id == parsed["shoes_id"]), shoes[0])

            return {
                "top": sel_top,
                "pants": sel_pants,
                "shoes": sel_shoes,
                "explanation": parsed.get("explanation", "Great outfit combination selected for today's forecast."),
                "styling_tips": parsed.get("styling_tips", ["Pair with classic accessories."]),
                "fit_score": parsed.get("weather_fit_score", 92)
            }
        except Exception as e:
            print(f"Gemini styling API error (using rule engine): {e}")

    # Fallback to algorithmic matching engine
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
