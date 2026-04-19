import json
import os

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from seismic_model import build_soil_heatmap, get_vs30, simulate, vs30_to_site_class, vs30_to_soil_factor, vs30_to_soil_strength_score

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/simulate")
def run_simulation(lat: float, lng: float, magnitude: float):
    return simulate(lat, lng, magnitude)


@app.get("/soil-heatmap")
def soil_heatmap(
    lat: float = Query(...),
    lng: float = Query(...),
):
    vs30 = get_vs30(lat, lng)
    strength = vs30_to_soil_strength_score(vs30)

    return {
        "center": {
            "lat": lat,
            "lng": lng,
            "vs30": None if vs30 is None else float(vs30),
            "soil_strength": None if strength is None else float(strength),
            "soil_strength_label": "unknown" if strength is None else (
                "very weak" if strength < 0.2 else
                "weak" if strength < 0.4 else
                "moderate" if strength < 0.6 else
                "strong" if strength < 0.8 else
                "very strong"
            ),
            "soil_factor": float(vs30_to_soil_factor(vs30)),
            "site_class": vs30_to_site_class(vs30),
        },
        "heatmap": build_soil_heatmap(lat, lng),
    }


@app.get("/region-insight")
def region_insight(lat: float = Query(...), lng: float = Query(...)):
    gemini_api_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("VITE_GEMINI_API_KEY")
    )

    local_vs30 = get_vs30(lat, lng)
    local_strength = vs30_to_soil_strength_score(local_vs30)
    local_site_class = vs30_to_site_class(local_vs30)

    soil_context = {
        "vs30": None if local_vs30 is None else float(local_vs30),
        "soil_strength": None if local_strength is None else float(local_strength),
        "site_class": local_site_class,
        "soil_factor": float(vs30_to_soil_factor(local_vs30)),
    }

    if not gemini_api_key:
        return {
            "regionName": "Southern California Region",
            "soilSummary": (
                f"Local site class: {soil_context['site_class']}. "
                f"VS30: {soil_context['vs30']}. "
                "Softer soils generally amplify shaking more than stiff ground."
            ),
            "populationDensity": "Unknown",
            "earthquakeHazards": ["ground shaking", "soil amplification"],
            "recommendedAction": "Set GEMINI_API_KEY in the backend environment.",
            "soilContext": soil_context,
        }

    prompt = f"""
You are a seismic hazard explainer for an earthquake-preparedness game.

The user clicked this Southern California location:
Latitude: {lat}
Longitude: {lng}

Measured / sampled local soil context:
{json.dumps(soil_context)}

Return ONLY valid JSON with this exact schema:
{{
  "regionName": "short readable region name",
  "soilSummary": "1-2 sentence summary of likely soil/ground conditions",
  "populationDensity": "short phrase with a rounded estimate",
  "earthquakeHazards": ["hazard 1", "hazard 2", "hazard 3"],
  "recommendedAction": "1-2 sentence practical recommendation"
}}

Keep it concise, practical, and readable in a small popup.
Use the provided soil context in the explanation.
Do not include markdown.
"""

    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        f"models/gemini-2.5-flash:generateContent?key={gemini_api_key}"
    )

    payload = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ]
    }

    try:
        headers = {
            "Content-Type": "application/json",
        }

        response = requests.post(url, headers=headers, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

        if text.startswith("```json"):
            text = text.removeprefix("```json").removesuffix("```").strip()
        elif text.startswith("```"):
            text = text.removeprefix("```").removesuffix("```").strip()

        parsed = json.loads(text)
        parsed["soilContext"] = soil_context
        return parsed

    except Exception as e:
        print("Gemini region insight failed:", repr(e))
        if 'response' in locals():
            print("Gemini response text:", response.text)
        return {
            "regionName": "Southern California Region",
            "soilSummary": (
                f"Local site class: {soil_context['site_class']}. "
                f"VS30: {soil_context['vs30']}. "
                "Detailed AI region insight is temporarily unavailable."
            ),
            "populationDensity": "Unknown",
            "earthquakeHazards": ["ground shaking", "localized damage", "soil amplification"],
            "recommendedAction": "Proceed with caution and prioritize emergency response placement.",
            "soilContext": soil_context,
        }