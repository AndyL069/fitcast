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

def calculate_color_score(top_color: str, pants_color: str, shoes_color: str, jacket_color: Optional[str] = None) -> float:
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

    if jacket_color:
        j = jacket_color.lower()
        if j in NEUTRALS or j in (t, p, s):
            score += 2.0

    return score

def algorithmic_outfit_matching(
    tops: List[ClothingItem],
    pants: List[ClothingItem],
    shoes: List[ClothingItem],
    weather: WeatherSummary,
    jackets: Optional[List[ClothingItem]] = None,
    vibe: str = "casual",
    locked_top_id: Optional[int] = None,
    locked_pants_id: Optional[int] = None,
    locked_shoes_id: Optional[int] = None,
    locked_jacket_id: Optional[int] = None
) -> Dict[str, Any]:
    target_warmth = weather.comfort_target
    target_vibe = vibe.lower() if vibe else "casual"

    cand_tops = [t for t in tops if t.id == locked_top_id] if locked_top_id else tops
    cand_pants = [p for p in pants if p.id == locked_pants_id] if locked_pants_id else pants
    cand_shoes = [s for s in shoes if s.id == locked_shoes_id] if locked_shoes_id else shoes

    if not cand_tops: cand_tops = tops
    if not cand_pants: cand_pants = pants
    if not cand_shoes: cand_shoes = shoes

    # Jacket selection logic: if jackets list is provided, pick the best matching jacket
    sel_jacket = None
    if jackets and len(jackets) > 0:
        cand_jackets = [j for j in jackets if j.id == locked_jacket_id] if locked_jacket_id else jackets
        if not cand_jackets: cand_jackets = jackets
        # Score jackets based on warmth & rain resistance
        best_jacket = None
        best_j_score = -999.0
        for j in cand_jackets:
            j_score = 30.0 - (abs(j.warmth_level - target_warmth) * 3.0)
            if (weather.is_rainy or weather.is_snowy) and j.waterproof:
                j_score += 15.0
            if target_vibe != "all" and j.formality == target_vibe:
                j_score += 4.0
            if j_score > best_j_score:
                best_j_score = j_score
                best_jacket = j
        sel_jacket = best_jacket

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

                score += calculate_color_score(top.color, pant.color, shoe.color, sel_jacket.color if sel_jacket else None)
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

    if sel_jacket:
        weather_note += f" Dazu passt perfekt die Jacke '{sel_jacket.name}'."

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
        "jacket": sel_jacket,
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
  "category": "top" | "pants" | "shoes" | "jacket",
  "name": "Beschreibender deutscher Titel (z.B. Dunkelblauer Wollpullover, Schwarze Lederjacke, Regenmantel)",
  "color": "Farbe auf Deutsch (z.B. Dunkelblau, Weiß, Schwarz, Beige)",
  "pattern": "einfarbig | gestreift | kariert | gemustert",
  "fabric": "Baumwolle | Wolle | Denim | Leder | Leinen | Synthetik | Fleece",
  "warmth_level": 1 bis 5 (1=sehr leichtes Sommerteil/Shorts, 3=mittelschweres Shirt/Chino, 5=schwerer Wintermantel/Stiefel),
  "formality": "casual | smart_casual | formal | athletic | lounge",
  "waterproof": true oder false
}
Hinweis zur Kategorie:
- Jacken, Mäntel, Blazer, Parkas, Windbreaker, Steppwesten -> "jacket"
- T-Shirts, Pullover, Hemden, Tops, Hoodies -> "top"
- Jeans, Chinos, Shorts, Jogginghosen -> "pants"
- Sneaker, Stiefel, Loafer, Sandalen -> "shoes"
Antworte NUR mit reinem JSON ohne Markdown-Codeblöcke."""

            config_kwargs: Dict[str, Any] = {"response_mime_type": "application/json"}
            try:
                config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
            except Exception:
                pass
            config = types.GenerateContentConfig(**config_kwargs)

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    prompt
                ],
                config=config
            )
            text = response.text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.endswith("```"): text = text[:-3]
            parsed = json.loads(text.strip())
            return parsed
        except Exception as e:
            print(f"Gemini Vision API error with model {settings.GEMINI_MODEL}: {e}")

    name_lower = filename.lower()
    if any(k in name_lower for k in ["jacke", "jacket", "coat", "mantel", "blazer", "parka", "windbreaker", "weste"]):
        cat = "jacket"
        name = "Jacke"
        warmth = 4
    elif any(k in name_lower for k in ["pant", "jean", "hose", "chino", "short"]):
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
    jackets: Optional[List[ClothingItem]] = None,
    vibe: str = "casual",
    locked_top_id: Optional[int] = None,
    locked_pants_id: Optional[int] = None,
    locked_shoes_id: Optional[int] = None,
    locked_jacket_id: Optional[int] = None
) -> Dict[str, Any]:
    if settings.GEMINI_API_KEY and len(tops) > 0 and len(pants) > 0 and len(shoes) > 0:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            
            top_catalog = [{"id": t.id, "name": t.name, "color": t.color, "warmth": t.warmth_level, "formality": t.formality} for t in tops]
            pants_catalog = [{"id": p.id, "name": p.name, "color": p.color, "warmth": p.warmth_level, "formality": p.formality} for p in pants]
            shoes_catalog = [{"id": s.id, "name": s.name, "color": s.color, "warmth": s.warmth_level, "formality": s.formality, "waterproof": s.waterproof} for s in shoes]
            jackets_catalog = [{"id": j.id, "name": j.name, "color": j.color, "warmth": j.warmth_level, "formality": j.formality, "waterproof": j.waterproof} for j in (jackets or [])]

            has_jackets = bool(jackets and len(jackets) > 0)
            jacket_rule = (
                "Wähle 1 Oberteil, 1 Hose, 1 Paar Schuhe und 1 Jacke aus (der Nutzer möchte ausdrücklich eine Jacke zu diesem Outfit)."
                if has_jackets
                else "Wähle 1 Oberteil, 1 Hose und 1 Paar Schuhe aus (keine Jacke auswählen)."
            )

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
Verfügbare Jacken & Mäntel: {json.dumps(jackets_catalog)}
Festgesetztes Oberteil ID: {locked_top_id}
Festgesetzte Hose ID: {locked_pants_id}
Festgesetzte Schuhe ID: {locked_shoes_id}
Festgesetzte Jacke ID: {locked_jacket_id}

{jacket_rule}
Antworte auf DEUTSCH mit einem JSON-Objekt in diesem Schema:
{{
  "top_id": <int>,
  "pants_id": <int>,
  "shoes_id": <int>,
  "jacket_id": <int aus den verfügbaren Jacken, oder null falls keine Jacken verfügbar sind>,
  "explanation": "<2-3 ansprechende Sätze auf Deutsch, warum dieses Outfit modisch ist und perfekt zum heutigen Wetter passt>",
  "styling_tips": ["<Tipp 1 auf Deutsch>", "<Tipp 2 auf Deutsch>"],
  "weather_fit_score": <int zwischen 80 und 99>
}}"""

            config_kwargs: Dict[str, Any] = {"response_mime_type": "application/json"}
            try:
                config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
            except Exception:
                pass
            config = types.GenerateContentConfig(**config_kwargs)

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=config
            )
            text = response.text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.endswith("```"): text = text[:-3]
            parsed = json.loads(text.strip())
            
            sel_top = next((t for t in tops if t.id == parsed.get("top_id")), tops[0])
            sel_pants = next((p for p in pants if p.id == parsed.get("pants_id")), pants[0])
            sel_shoes = next((s for s in shoes if s.id == parsed.get("shoes_id")), shoes[0])
            
            sel_jacket = None
            if jackets and parsed.get("jacket_id"):
                sel_jacket = next((j for j in jackets if j.id == parsed["jacket_id"]), None)

            return {
                "top": sel_top,
                "pants": sel_pants,
                "shoes": sel_shoes,
                "jacket": sel_jacket,
                "explanation": parsed.get("explanation", "Hervorragende Outfit-Kombination für die heutige Wetterlage."),
                "styling_tips": parsed.get("styling_tips", ["Mit klassischen Accessoires kombinieren."]),
                "fit_score": parsed.get("weather_fit_score", 92)
            }
        except Exception as e:
            print(f"Gemini styling API error with model {settings.GEMINI_MODEL}: {e}")

    return algorithmic_outfit_matching(
        tops=tops,
        pants=pants,
        shoes=shoes,
        jackets=jackets,
        weather=weather,
        vibe=vibe,
        locked_top_id=locked_top_id,
        locked_pants_id=locked_pants_id,
        locked_shoes_id=locked_shoes_id,
        locked_jacket_id=locked_jacket_id
    )

async def generate_match_suggestions_with_ai(
    current_top: ClothingItem,
    current_pants: ClothingItem,
    current_shoes: ClothingItem,
    weather: WeatherSummary,
    other_items: List[ClothingItem],
    current_jacket: Optional[ClothingItem] = None,
    vibe: str = "casual"
) -> Dict[str, Any]:
    """
    Analysiert das aktuelle Outfit und liefert:
    1. Passende Alternativen aus dem vorhandenen Kleiderschrank (z.B. alternatives Oberteil / Schuhe).
    2. Konkrete Shopping-/Erweiterungsvorschläge (z.B. Accessoires, Schals, besondere Kleidungsstücke).
    """
    current_outfit_desc = {
        "Oberteil": f"{current_top.name} ({current_top.color}, {current_top.fabric}, Wärmegrad {current_top.warmth_level})",
        "Hose": f"{current_pants.name} ({current_pants.color}, {current_pants.fabric}, Wärmegrad {current_pants.warmth_level})",
        "Schuhe": f"{current_shoes.name} ({current_shoes.color}, {current_shoes.fabric})",
        "Jacke": f"{current_jacket.name} ({current_jacket.color})" if current_jacket else "Keine"
    }

    available_catalog = [
        {
            "id": it.id,
            "category": it.category,
            "name": it.name,
            "color": it.color,
            "fabric": it.fabric,
            "warmth": it.warmth_level,
            "formality": it.formality
        }
        for it in other_items
    ]

    closet_alternatives = []
    shopping_suggestions = []
    stylist_summary = "Hier sind passende Ergänzungen und Styling-Alternativen für diesen Look."

    if settings.GEMINI_API_KEY:
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            prompt = f"""Du bist Cher Horowitz, professionelle Stylistin aus 'Clueless'.
Ein Nutzer liebt dieses aktuelle Outfit und möchte Alternativen aus seinem Schrank sowie neue Shopping-Ideen erhalten:

Aktuelles Outfit:
{json.dumps(current_outfit_desc, ensure_ascii=False, indent=2)}

Wetter: {weather.city}, {weather.temperature}°C (Gefühlt: {weather.apparent_temperature}°C), {weather.condition}, Anlass/Vibe: {vibe}

Weitere verfügbare Teile im Kleiderschrank des Nutzers:
{json.dumps(available_catalog, ensure_ascii=False, indent=2)}

Aufgaben:
1. 'closet_alternatives': Wähle 2 bis 4 Teile aus den verfügbaren Schrank-Teilen aus, die als Alternative für eines der aktuellen Teile (z.B. anderes Oberteil, andere Schuhe oder andere Jacke) extrem stylisch zu den restlichen Teilen passen würden. Gib die item_id, die Kategorie, die es ersetzt ('top', 'pants', 'shoes', 'jacket') und eine prägnante Begründung auf Deutsch an.
2. 'shopping_suggestions': Schlage 2 bis 3 konkrete neue Teile oder Accessoires vor (z.B. 'Camel Wollschal', 'Cognacbrauner Ledergürtel', 'Oversized Blazer in Anthrazit'), die das Outfit ideal abrunden oder variieren würden. Gib Titel, Kategorie ('Accessoire', 'Oberteil', 'Jacke', 'Schuhe'), empfohlene Farbe, prägnante Begründung ('why') und einen optimalen deutschen Google-Shopping Suchbegriff ('search_query') an.
3. 'stylist_summary': 1-2 charmante Sätze im Stylisten-Ton über das Potenzial dieses Looks.

Antworte ausschließlich im JSON-Format:
{{
  "stylist_summary": "...",
  "closet_alternatives": [
    {{
      "item_id": <int aus verfügbaren Teilen>,
      "replaces_category": "<top | pants | shoes | jacket>",
      "reason": "<Begründung auf Deutsch>"
    }}
  ],
  "shopping_suggestions": [
    {{
      "title": "<Produktbezeichnung>",
      "category": "<Kategorie>",
      "color": "<Farbe>",
      "why": "<Warum es passt>",
      "search_query": "<Suchbegriff für Shopping-Suche>"
    }}
  ]
}}"""

            config_kwargs: Dict[str, Any] = {"response_mime_type": "application/json"}
            try:
                config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=0)
            except Exception:
                pass
            config = types.GenerateContentConfig(**config_kwargs)

            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=config
            )
            text = response.text.strip()
            if text.startswith("```json"): text = text[7:]
            if text.endswith("```"): text = text[:-3]
            parsed = json.loads(text.strip())

            stylist_summary = parsed.get("stylist_summary", stylist_summary)

            for alt in parsed.get("closet_alternatives", []):
                matching_item = next((it for it in other_items if it.id == alt.get("item_id")), None)
                if matching_item:
                    closet_alternatives.append({
                        "item": matching_item,
                        "replaces_category": alt.get("replaces_category", matching_item.category),
                        "reason": alt.get("reason", "Harmoniert wunderbar mit den restlichen Teilen.")
                    })

            for shop in parsed.get("shopping_suggestions", []):
                if shop.get("title"):
                    shopping_suggestions.append({
                        "title": shop.get("title"),
                        "category": shop.get("category", "Accessoire"),
                        "color": shop.get("color", "neutral"),
                        "why": shop.get("why", "Ergänzt den Look perfekt."),
                        "search_query": shop.get("search_query", shop.get("title"))
                    })

            return {
                "closet_alternatives": closet_alternatives,
                "shopping_suggestions": shopping_suggestions,
                "stylist_summary": stylist_summary
            }
        except Exception as e:
            print(f"Error generating match suggestions with Gemini: {e}")

    # Fallback if AI call fails or no API key
    if other_items:
        sample_alt = other_items[:3]
        for it in sample_alt:
            closet_alternatives.append({
                "item": it,
                "replaces_category": it.category,
                "reason": f"Passt durch die Farbe {it.color} und den Stil vielseitig zu deinem Look."
            })

    if not shopping_suggestions:
        shopping_suggestions = [
            {
                "title": f"Passender Ledergürtel in {current_shoes.color}",
                "category": "Accessoire",
                "color": current_shoes.color,
                "why": "Ein farblich auf die Schuhe abgestimmter Gürtel schafft eine saubere visuelle Linie.",
                "search_query": f"Ledergürtel {current_shoes.color}"
            },
            {
                "title": "Klassischer Schal / Tuch",
                "category": "Accessoire",
                "color": "Neutral",
                "why": "Verleiht dem Outfit zusätzliche Textur und Tiefe bei kühlerem Wetter.",
                "search_query": "Wollschal klassisch neutral"
            }
        ]

    return {
        "closet_alternatives": closet_alternatives,
        "shopping_suggestions": shopping_suggestions,
        "stylist_summary": stylist_summary
    }

