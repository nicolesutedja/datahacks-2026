from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from seismic_model import simulate

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