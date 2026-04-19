import os
import json
import requests
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from seismic_model import simulate
from dotenv import load_dotenv
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


@app.get("/region-insight")
def region_insight(lat: float = Query(...), lng: float = Query(...)):
    gemini_api_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or os.getenv("VITE_GEMINI_API_KEY")
    )

    if not gemini_api_key:
        return {
            "regionName": "Southern California Region",
            "soilSummary": "Gemini API key missing. Unable to generate detailed soil summary.",
            "populationDensity": "Unknown",
            "earthquakeHazards": ["ground shaking"],
            "recommendedAction": "Set GEMINI_API_KEY in the backend environment.",
        }

    prompt = f"""
You are a seismic hazard explainer for an earthquake-preparedness game.

The user clicked this Southern California location:
Latitude: {lat}
Longitude: {lng}

Return ONLY valid JSON with this exact schema:
{{
  "regionName": "short readable region name",
  "soilSummary": "1-2 sentence summary of likely soil/ground conditions",
  "populationDensity": "short phrase like low, medium, high, very high",
  "earthquakeHazards": ["hazard 1", "hazard 2", "hazard 3"],
  "recommendedAction": "1-2 sentence practical recommendation"
}}

Keep it concise, practical, and readable in a small popup.
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
        response = requests.post(url, json=payload, timeout=20)
        response.raise_for_status()
        data = response.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()

        if text.startswith("```json"):
            text = text.removeprefix("```json").removesuffix("```").strip()
        elif text.startswith("```"):
            text = text.removeprefix("```").removesuffix("```").strip()

        parsed = json.loads(text)
        return parsed

    except Exception as e:
        print("Gemini region insight failed:", repr(e))
        return {
            "regionName": "Southern California Region",
            "soilSummary": "Detailed AI region insight is temporarily unavailable.",
            "populationDensity": "Unknown",
            "earthquakeHazards": ["ground shaking", "localized damage"],
            "recommendedAction": "Proceed with caution and prioritize emergency response placement.",
        }