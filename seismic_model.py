import math
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import rasterio
from scipy.interpolate import RBFInterpolator
from sklearn.base import BaseEstimator, RegressorMixin
from sklearn.decomposition import PCA

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

# Soil heatmap controls
SOIL_MIN_STEP_DEGREES = 0.0028
SOIL_MAX_POINTS_PER_AXIS = 120
SOIL_LOCAL_FILL_RADIUS = 2
SOIL_MIN_VALID_NEIGHBORS = 3
SOIL_LOCAL_FILL_RADIUS = 2
SOIL_MIN_VALID_NEIGHBORS = 3
SOIL_MAX_POINTS_PER_AXIS = 140
SOIL_MIN_STEP_DEGREES = 0.0012
RECEIVER_RING_FRACTION = 0.72

# =========================================================
# CUSTOM RBF WRAPPER
# Needed so joblib can deserialize rom_model.joblib
# =========================================================
class RBFWrapper(BaseEstimator, RegressorMixin):
    def __init__(self, kernel: str = "cubic", epsilon=None):
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
def magnitude_scale(
    magnitude: float,
    reference_magnitude: float = REFERENCE_MAGNITUDE,
    alpha: float = MAGNITUDE_ALPHA,
) -> float:
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
    Sample the VS30 raster at a lat/lng. Returns a float or None.
    """
    try:
        row, col = vs30_dataset.index(lng, lat)
        if row < 0 or col < 0 or row >= vs30_map.shape[0] or col >= vs30_map.shape[1]:
            return None

        val = vs30_map[row, col]
        if np.isnan(val) or val <= 0:
            return None

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


def vs30_to_site_class(vs30):
    """
    NEHRP-style site classes from Vs30.
    """
    if vs30 is None:
        return "Unknown"
    if vs30 < 180:
        return "E"
    if vs30 < 360:
        return "D"
    if vs30 < 760:
        return "C"
    if vs30 < 1500:
        return "B"
    return "A"


def vs30_to_soil_strength_score(vs30):
    """
    Normalize VS30 to a user-facing 0..1 soil strength score.
    Higher = stronger/stiffer ground.
    """
    if vs30 is None:
        return None

    lo, hi = 120.0, 1000.0
    clipped = max(lo, min(hi, float(vs30)))
    return (clipped - lo) / (hi - lo)


def soil_strength_label(score):
    if score is None:
        return "unknown"
    if score < 0.2:
        return "very weak"
    if score < 0.4:
        return "weak"
    if score < 0.6:
        return "moderate"
    if score < 0.8:
        return "strong"
    return "very strong"


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
    measured in model coordinate space since source_locations.csv
    stores length/width/depth rather than lat/lng.
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

def confidence_score_from_click(lat: float, lng: float) -> float:
    """
    Numeric confidence score in [0, 1] based on distance from training coverage.
    Higher means the click is closer to known training samples.
    """
    length_km, width_km, _ = latlng_to_model_coords(lat, lng)
    train_coords = source_locations[["length", "width"]].to_numpy(dtype=np.float32)
    click_coord = np.array([length_km, width_km], dtype=np.float32)
    dists = np.linalg.norm(train_coords - click_coord, axis=1)
    min_dist = float(np.min(dists))

    score = math.exp(-min_dist / 14.0)
    return float(max(0.0, min(1.0, score)))


def summarize_impact(adjusted_pgv: list[float], risk_classes: list[str], confidence_score: float):
    """
    Convert raw PGV/risk outputs into simple aggregate metrics for the frontend.
    """
    if not adjusted_pgv:
        return {
            "mean_pgv": 0.0,
            "max_pgv": 0.0,
            "high_risk_ratio": 0.0,
            "extreme_risk_ratio": 0.0,
            "expected_damage_index": 0.0,
            "predicted_severity": "low",
            "model_reliability": 0.0,
        }

    arr = np.array(adjusted_pgv, dtype=np.float32)
    high_risk_ratio = float(sum(r in ("high", "extreme") for r in risk_classes) / len(risk_classes))
    extreme_risk_ratio = float(sum(r == "extreme" for r in risk_classes) / len(risk_classes))

    damage_index = float(
        min(
            100.0,
            (
                45.0 * (float(np.mean(arr)) / 0.08)
                + 30.0 * (float(np.max(arr)) / 0.12)
                + 15.0 * high_risk_ratio
                + 10.0 * extreme_risk_ratio
            )
        )
    )

    calibrated_reliability = float(
        max(
            0.45,
            min(
                1.0,
                0.82 * confidence_score + 0.18 * (1.0 - extreme_risk_ratio * 0.35),
            ),
        )
    )

    if damage_index < 25:
        severity = "low"
    elif damage_index < 50:
        severity = "moderate"
    elif damage_index < 75:
        severity = "high"
    else:
        severity = "severe"

    return {
        "mean_pgv": float(np.mean(arr)),
        "max_pgv": float(np.max(arr)),
        "high_risk_ratio": high_risk_ratio,
        "extreme_risk_ratio": extreme_risk_ratio,
        "expected_damage_index": damage_index,
        "predicted_severity": severity,
        "model_reliability": calibrated_reliability,
    }


def build_receiver_soil_samples(lat: float, lng: float, magnitude: float, count: int):
    """
    Place receiver samples around the epicenter in a ring so soil/risk outputs are
    spatially distributed instead of marching along one diagonal line.
    """
    samples = []

    radius_km = estimate_surface_wave_radius_km(magnitude) * RECEIVER_RING_FRACTION
    radius_deg_lat = radius_km / 111.0
    cos_lat = max(math.cos(math.radians(lat)), 0.2)
    radius_deg_lng = radius_km / (111.0 * cos_lat)

    for i in range(count):
        theta = (2.0 * math.pi * i) / max(count, 1)
        offset_lat = lat + radius_deg_lat * math.sin(theta)
        offset_lng = lng + radius_deg_lng * math.cos(theta)

        vs30 = get_vs30(offset_lat, offset_lng)
        soil_factor = vs30_to_soil_factor(vs30)
        soil_strength = vs30_to_soil_strength_score(vs30)

        samples.append(
            {
                "receiver_id": i,
                "lat": float(offset_lat),
                "lng": float(offset_lng),
                "angle_rad": float(theta),
                "radius_km": float(radius_km),
                "vs30": None if vs30 is None else float(vs30),
                "soil_factor": float(soil_factor),
                "soil_strength": None if soil_strength is None else float(soil_strength),
                "soil_strength_label": soil_strength_label(soil_strength),
                "site_class": vs30_to_site_class(vs30),
            }
        )

    return samples


def estimate_surface_wave_radius_km(magnitude: float) -> float:
    """
    Match the CURRENT frontend outer visible ring instead of the old oversized estimate.
    Frontend uses:
      magnitudeSpeedFactor = max(0.9, 1 + (magnitude - 5.0) * 0.35)
      surfaceRadiusMeters = 65000 * magnitudeSpeedFactor * amplitudeScale
    with amplitudeScale ~= 1 here.
    """
    magnitude_speed_factor = max(0.9, 1.0 + (magnitude - 5.0) * 0.35)
    radius_meters = 65000.0 * magnitude_speed_factor
    return radius_meters / 1000.0


def _neighbor_fill(grid: np.ndarray, valid_mask: np.ndarray, circle_mask: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """
    Fill only small local gaps near valid land samples so the heatmap becomes continuous
    without bleeding far into water/off-map areas.
    """
    filled = grid.copy()
    filled_mask = valid_mask.copy()
    rows, cols = grid.shape

    for _ in range(2):
        updates = []
        for r in range(rows):
            for c in range(cols):
                if not circle_mask[r, c]:
                    continue
                if filled_mask[r, c]:
                    continue

                values = []
                weights = []

                for dr in range(-SOIL_LOCAL_FILL_RADIUS, SOIL_LOCAL_FILL_RADIUS + 1):
                    for dc in range(-SOIL_LOCAL_FILL_RADIUS, SOIL_LOCAL_FILL_RADIUS + 1):
                        if dr == 0 and dc == 0:
                            continue

                        rr = r + dr
                        cc = c + dc
                        if rr < 0 or rr >= rows or cc < 0 or cc >= cols:
                            continue
                        if not circle_mask[rr, cc]:
                            continue
                        if not filled_mask[rr, cc]:
                            continue

                        dist = math.sqrt(dr * dr + dc * dc)
                        if dist == 0:
                            continue

                        values.append(filled[rr, cc])
                        weights.append(1.0 / dist)

                if len(values) >= SOIL_MIN_VALID_NEIGHBORS:
                    weighted = float(np.average(np.array(values), weights=np.array(weights)))
                    updates.append((r, c, weighted))

        if not updates:
            break

        for r, c, weighted in updates:
            filled[r, c] = weighted
            filled_mask[r, c] = True

    return filled, filled_mask


def _smooth_grid(grid: np.ndarray, valid_mask: np.ndarray) -> np.ndarray:
    """
    Light local smoothing so the output behaves like one continuous heatmap.
    """
    smoothed = grid.copy()
    rows, cols = grid.shape

    for r in range(rows):
        for c in range(cols):
            if not valid_mask[r, c]:
                continue

            values = []
            for dr in (-1, 0, 1):
                for dc in (-1, 0, 1):
                    rr = r + dr
                    cc = c + dc
                    if rr < 0 or rr >= rows or cc < 0 or cc >= cols:
                        continue
                    if valid_mask[rr, cc]:
                        values.append(grid[rr, cc])

            if values:
                smoothed[r, c] = float(np.mean(values))

    return smoothed


def build_soil_heatmap(lat: float, lng: float, magnitude: float):
    """
    Build a dense, continuous soil heatmap that expands from the epicenter out to the
    SAME outer circle the user sees, and stops there.

    It stays effectively land-only by starting from direct VS30 samples and only filling
    tiny local gaps near valid samples, instead of extrapolating broadly across water.
    """
    radius_km = estimate_surface_wave_radius_km(magnitude)

    radius_deg_lat = radius_km / 111.0
    cos_lat = max(math.cos(math.radians(lat)), 0.2)
    radius_deg_lng = radius_km / (111.0 * cos_lat)

    # Dense enough to blend continuously, but not absurdly huge.
    target_axis_points = min(
        SOIL_MAX_POINTS_PER_AXIS,
        max(85, int(radius_km * 3.2))
    )

    step_lat = max(SOIL_MIN_STEP_DEGREES, (2.0 * radius_deg_lat) / target_axis_points)
    step_lng = max(SOIL_MIN_STEP_DEGREES, (2.0 * radius_deg_lng) / target_axis_points)

    lat_offsets = np.arange(-radius_deg_lat, radius_deg_lat + step_lat, step_lat)
    lng_offsets = np.arange(-radius_deg_lng, radius_deg_lng + step_lng, step_lng)

    n_rows = len(lat_offsets)
    n_cols = len(lng_offsets)

    soil_grid = np.full((n_rows, n_cols), np.nan, dtype=np.float32)
    valid_mask = np.zeros((n_rows, n_cols), dtype=bool)
    circle_mask = np.zeros((n_rows, n_cols), dtype=bool)

    for r, dlat in enumerate(lat_offsets):
        for c, dlng in enumerate(lng_offsets):
            dy_km = float(dlat) * 111.0
            dx_km = float(dlng) * 111.0 * cos_lat
            dist_km = math.sqrt(dx_km * dx_km + dy_km * dy_km)

            if dist_km > radius_km:
                continue

            circle_mask[r, c] = True

            sample_lat = lat + float(dlat)
            sample_lng = lng + float(dlng)

            vs30 = get_vs30(sample_lat, sample_lng)
            soil_strength = vs30_to_soil_strength_score(vs30)

            if soil_strength is None:
                continue

            soil_grid[r, c] = float(soil_strength)
            valid_mask[r, c] = True

    soil_grid, valid_mask = _neighbor_fill(soil_grid, valid_mask, circle_mask)
    valid_mask = valid_mask & circle_mask
    soil_grid = _smooth_grid(soil_grid, valid_mask)

    features = []

    for r, dlat in enumerate(lat_offsets):
        for c, dlng in enumerate(lng_offsets):
            if not circle_mask[r, c]:
                continue
            if not valid_mask[r, c]:
                continue

            sample_lat = lat + float(dlat)
            sample_lng = lng + float(dlng)
            strength = float(soil_grid[r, c])

            approx_vs30 = 120.0 + strength * (1000.0 - 120.0)
            soil_factor = vs30_to_soil_factor(approx_vs30)

            dy_km = float(dlat) * 111.0
            dx_km = float(dlng) * 111.0 * cos_lat
            dist_km = math.sqrt(dx_km * dx_km + dy_km * dy_km)

            features.append(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [float(sample_lng), float(sample_lat)],
                    },
                    "properties": {
                        "vs30": float(approx_vs30),
                        "soil_strength": strength,
                        "soil_strength_label": soil_strength_label(strength),
                        "soil_factor": float(soil_factor),
                        "site_class": vs30_to_site_class(approx_vs30),
                        "distance_km": float(dist_km),
                    },
                }
            )

    return {
        "type": "FeatureCollection",
        "features": features,
        "meta": {
            "radius_km": float(radius_km),
            "step_lat": float(step_lat),
            "step_lng": float(step_lng),
            "point_count": len(features),
        },
    }

# =========================================================
# MAIN PUBLIC FUNCTION FOR FASTAPI
# =========================================================
def simulate(lat: float, lng: float, magnitude: float):
    """
    Main entry point for FastAPI server.
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
    soil_strength_values = []
    site_classes = []
    risk_classes = []

    receiver_soil = build_receiver_soil_samples(lat, lng, magnitude, len(scaled_pgv))

    for i, base_pgv in enumerate(scaled_pgv):
        soil_sample = receiver_soil[i]
        soil_factor = soil_sample["soil_factor"]
        adjusted = float(base_pgv) * float(soil_factor)

        adjusted_pgv.append(float(adjusted))
        soil_factors.append(float(soil_factor))
        vs30_values.append(soil_sample["vs30"])
        soil_strength_values.append(soil_sample["soil_strength"])
        site_classes.append(soil_sample["site_class"])
        risk_classes.append(pgv_to_risk_class(adjusted))

    confidence = confidence_from_click(lat, lng)
    confidence_score = confidence_score_from_click(lat, lng)
    impact_summary = summarize_impact(adjusted_pgv, risk_classes, confidence_score)
    max_amplitude = float(np.max(np.abs(scaled_wave)))

    liquefaction = [
        float(
            (adj ** 1.5)
            * (soil_factor - 1.0 if soil_factor > 1.0 else 0.1)
            * 5
        )
        for adj, soil_factor in zip(adjusted_pgv, soil_factors)
    ]

    soil_heatmap = build_soil_heatmap(lat, lng, magnitude)

    epicenter_vs30 = get_vs30(lat, lng)
    epicenter_soil_strength = vs30_to_soil_strength_score(epicenter_vs30)

    return {
        "waveform": scaled_wave.tolist(),
        "pgv": [float(x) for x in scaled_pgv.tolist()],
        "adjusted_pgv": adjusted_pgv,
        "risk_classes": risk_classes,
        "soil_factors": soil_factors,
        "vs30": vs30_values,
        "soil_strength": soil_strength_values,
        "site_classes": site_classes,
        "receiver_soil": receiver_soil,
        "soil_heatmap": soil_heatmap,
        "epicenter_soil": {
            "vs30": None if epicenter_vs30 is None else float(epicenter_vs30),
            "soil_strength": None if epicenter_soil_strength is None else float(epicenter_soil_strength),
            "soil_strength_label": soil_strength_label(epicenter_soil_strength),
            "soil_factor": float(vs30_to_soil_factor(epicenter_vs30)),
            "site_class": vs30_to_site_class(epicenter_vs30),
        },
        "confidence": confidence,
        "confidence_score": float(confidence_score),
        "impact_summary": impact_summary,
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


if __name__ == "__main__":
    test = simulate(lat=32.85, lng=-117.25, magnitude=6.8)
    print("Waveform shape:", np.array(test["waveform"]).shape)
    print("Adjusted PGV length:", len(test["adjusted_pgv"]))
    print("Soil heatmap points:", len(test["soil_heatmap"]["features"]))
    print("Soil heatmap meta:", test["soil_heatmap"]["meta"])
    print("Confidence:", test["confidence"])