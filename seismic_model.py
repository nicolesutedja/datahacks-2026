import math
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sys
import rasterio
from scipy.interpolate import RBFInterpolator
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.decomposition import PCA
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


# =========================================================
# PATHS
# =========================================================

ROOT = Path(__file__).resolve().parent
ARTIFACTS_DIR = ROOT / "artifacts"

ROM_MODEL_PATH = ARTIFACTS_DIR / "rom_model.joblib"
PCA_PATH = ARTIFACTS_DIR / "pca.joblib"
SOURCE_LOCATIONS_PATH = ROOT / "source_locations.csv"

VS30_CANDIDATES = [
    ROOT / "vs30.tif",
    ROOT / "California_vs30_Wills15_hybrid_sd.tif",
]


# =========================================================
# CONSTANTS
# =========================================================

LA_JOLLA_LAT = 32.8328
LA_JOLLA_LNG = -117.2713

N_RECEIVERS = 16
N_TIMESTEPS = 600

REFERENCE_MAGNITUDE = 5.0
MAGNITUDE_ALPHA = 0.5


# =========================================================
# CUSTOM RBF WRAPPER
# Needed so joblib can deserialize your trained rom_model.joblib
# =========================================================

class RBFWrapper(BaseEstimator, RegressorMixin):
    def __init__(self, kernel="cubic", epsilon=None):
        self.kernel = kernel
        self.epsilon = epsilon
        self.interp_ = None
        self.X_train_ = None
        self.y_train_ = None

    def fit(self, X, y):
        self.X_train_ = np.array(X)
        self.y_train_ = np.array(y)
        self.interp_ = RBFInterpolator(
            self.X_train_,
            self.y_train_,
            kernel=self.kernel,
            epsilon=self.epsilon,
        )
        return self

    def predict(self, X):
        if self.interp_ is None:
            raise ValueError("The model is not fitted yet.")
        return self.interp_(np.array(X))

sys.modules["__main__"].RBFWrapper = RBFWrapper
sys.modules["__mp_main__"].RBFWrapper = RBFWrapper

# =========================================================
# LOAD ARTIFACTS ONCE
# =========================================================

def _load_vs30_dataset():
    for path in VS30_CANDIDATES:
        if path.exists():
            return rasterio.open(path)
    raise FileNotFoundError(
        f"Could not find a VS30 raster. Tried: {[str(p) for p in VS30_CANDIDATES]}"
    )


print("Loading seismic model artifacts...")
model_rom = joblib.load(ROM_MODEL_PATH)
pca: PCA = joblib.load(PCA_PATH)
source_locations = pd.read_csv(SOURCE_LOCATIONS_PATH)
vs30_dataset = _load_vs30_dataset()
vs30_map = vs30_dataset.read(1)
print("Artifacts loaded successfully.")


# =========================================================
# CORE MODEL HELPERS
# =========================================================

def magnitude_scale(magnitude: float,
                    reference_magnitude: float = REFERENCE_MAGNITUDE,
                    alpha: float = MAGNITUDE_ALPHA) -> float:
    return 10 ** (alpha * (magnitude - reference_magnitude))


def reconstruct_wave_from_rom(model_rom, pca, X_new, original_shape):
    """
    Reconstruct waveform from ROM + PCA.
    original_shape = (n_receivers, n_timesteps)
    """
    n_receivers, n_timesteps = original_shape
    Z_pred = model_rom.predict(X_new)
    Y_pred = pca.inverse_transform(Z_pred)
    wave = Y_pred.reshape(len(X_new), n_receivers, n_timesteps)
    return wave


def predict_earthquake_numeric_response(
    model_rom,
    pca,
    length: float,
    width: float,
    depth: float,
    magnitude: float,
    n_receivers: int = N_RECEIVERS,
    n_timesteps: int = N_TIMESTEPS,
    reference_magnitude: float = REFERENCE_MAGNITUDE,
    alpha: float = MAGNITUDE_ALPHA,
):
    """
    Core surrogate prediction.
    Returns base + scaled wave and PGV.
    """
    X_new = np.array([[length, width, depth]], dtype=np.float32)

    base_wave = reconstruct_wave_from_rom(
        model_rom=model_rom,
        pca=pca,
        X_new=X_new,
        original_shape=(n_receivers, n_timesteps),
    )[0]

    scale = magnitude_scale(magnitude, reference_magnitude, alpha)
    scaled_wave = base_wave * scale

    base_pgv = np.max(np.abs(base_wave), axis=-1)
    scaled_pgv = np.max(np.abs(scaled_wave), axis=-1)

    return {
        "base_wave": base_wave,
        "scaled_wave": scaled_wave,
        "base_pgv": base_pgv,
        "scaled_pgv": scaled_pgv,
    }


# =========================================================
# UI / GEO HELPERS
# =========================================================

def latlng_to_model_coords(lat: float, lng: float):
    """
    Convert frontend lat/lng into the model coordinate system used by the notebook.
    length and width are in km relative to La Jolla.
    """
    length_km = (lng - LA_JOLLA_LNG) * 111.0 * math.cos(math.radians(lat))
    width_km = (lat - LA_JOLLA_LAT) * 111.0
    depth_km = 10.0
    return float(length_km), float(width_km), float(depth_km)


def get_vs30(lat: float, lng: float):
    """
    Sample the VS30 raster at a lat/lng.
    Returns a float or None.
    """
    try:
        row, col = vs30_dataset.index(lng, lat)

        if row < 0 or col < 0 or row >= vs30_map.shape[0] or col >= vs30_map.shape[1]:
            return None

        val = vs30_map[row, col]

        if np.isnan(val) or val <= 0:
            return None

        # Notebook had this normalization guard
        if val < 10:
            val = val * 1000

        return float(val)
    except Exception:
        return None


def vs30_to_soil_factor(vs30):
    """
    Soil amplification factor for PGV.
    Softer soil => larger multiplier.
    """
    if vs30 is None:
        return 1.0
    if vs30 < 180:
        return 1.4
    if vs30 < 300:
        return 1.25
    if vs30 < 500:
        return 1.1
    return 0.9


def pgv_to_risk_class(pgv: float) -> str:
    if pgv < 0.01:
        return "low"
    if pgv < 0.03:
        return "moderate"
    if pgv < 0.07:
        return "high"
    return "extreme"


def confidence_from_click(lat: float, lng: float) -> str:
    """
    Confidence based on proximity to known training source locations,
    but measured in the model's coordinate space, since source_locations.csv
    has length/width/depth rather than lat/lng.
    """
    length_km, width_km, _ = latlng_to_model_coords(lat, lng)

    train_coords = source_locations[["length", "width"]].to_numpy(dtype=np.float32)
    click_coord = np.array([length_km, width_km], dtype=np.float32)

    dists = np.linalg.norm(train_coords - click_coord, axis=1)
    min_dist = float(np.min(dists))

    if min_dist < 2.0:
        return "high"
    if min_dist < 8.0:
        return "medium"
    return "low"


# =========================================================
# MAIN PUBLIC FUNCTION FOR FASTAPI
# =========================================================

def simulate(lat: float, lng: float, magnitude: float):
    """
    Main entry point for your FastAPI server.
    Returns a frontend-ready JSON-serializable dict.
    """
    length_km, width_km, depth_km = latlng_to_model_coords(lat, lng)

    results = predict_earthquake_numeric_response(
        model_rom=model_rom,
        pca=pca,
        length=length_km,
        width=width_km,
        depth=depth_km,
        magnitude=magnitude,
        n_receivers=N_RECEIVERS,
        n_timesteps=N_TIMESTEPS,
    )

    scaled_wave = results["scaled_wave"]
    scaled_pgv = results["scaled_pgv"]

    adjusted_pgv = []
    soil_factors = []
    vs30_values = []
    risk_classes = []

    # Same "fake receiver spread" logic you were already using conceptually
    for i, base_pgv in enumerate(scaled_pgv):
        offset_lat = lat + (i * 0.002)
        offset_lng = lng + (i * 0.002)

        vs30 = get_vs30(offset_lat, offset_lng)
        soil_factor = vs30_to_soil_factor(vs30)

        adj = float(base_pgv) * soil_factor

        vs30_values.append(vs30)
        soil_factors.append(float(soil_factor))
        adjusted_pgv.append(float(adj))
        risk_classes.append(pgv_to_risk_class(adj))

    confidence = confidence_from_click(lat, lng)

    # Optional extra frontend fields, based on notebook
    max_amplitude = float(np.max(np.abs(scaled_wave)))
    liquefaction = [
        float((adj ** 1.5) * (soil_factor - 1.0 if soil_factor > 1.0 else 0.1) * 5)
        for adj, soil_factor in zip(adjusted_pgv, soil_factors)
    ]

    return {
        "waveform": scaled_wave.tolist(),
        "pgv": [float(x) for x in scaled_pgv.tolist()],
        "adjusted_pgv": adjusted_pgv,
        "risk_classes": risk_classes,
        "soil_factors": soil_factors,
        "vs30": vs30_values,
        "confidence": confidence,
        "max_amplitude": max_amplitude,
        "pgv_heatmap": adjusted_pgv,
        "liquefaction": liquefaction,
        "timesteps": N_TIMESTEPS,
        "model_coords": {
            "length": length_km,
            "width": width_km,
            "depth": depth_km,
        },
    }


# =========================================================
# LOCAL TEST
# =========================================================

if __name__ == "__main__":
    test = simulate(lat=32.85, lng=-117.25, magnitude=6.8)
    print("Waveform shape:", np.array(test["waveform"]).shape)
    print("Adjusted PGV length:", len(test["adjusted_pgv"]))
    print("Confidence:", test["confidence"])