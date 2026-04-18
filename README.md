# Seismic Sentinel: Real-Time Survival Game
**DataHacks 2026 | Scripps Institution of Oceanography Challenge**

Seismic Sentinel is a professional, high-fidelity emergency response simulation. It utilizes physics-aware surrogate models to predict seismic wave propagation in real-time, allowing users to strategically deploy resources across San Diego as an earthquake unfolds.

---

## 🛠️ Project Execution

### 1. Installation
Clone the repository and install the dependencies.

```bash
# Clone the repository
git clone https://github.com/nicolesutedja/datahacks-2026.git
cd datahacks-2026

# Install dependencies
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory. This is critical for the 3D map rendering and AI integrations.

```bash
# --- Mapping Infrastructure ---
# Get at cloud.maptiler.com (Free Tier)
VITE_MAPTILER_KEY=your_maptiler_key_here

# Get at console.cloud.google.com (Enabled Maps JS API)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# --- AI & Immersive Intelligence ---
# Get at aistudio.google.com
VITE_GEMINI_API_KEY=your_gemini_key_here

# Get at elevelabs.io
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key_here

# --- ML Model Endpoint ---
# Deployment URL from Impulse AI
VITE_IMPULSE_API_URL=your_impulse_endpoint_here
```

### 3. Local Development
Start the Vite development server. **Note:** If you change your `.env` file, you must restart this process.

```bash
npm run dev
```

---

## 🎮 Features & Mechanics

### 3D Map Visualization
- **MapLibre GL JS** with 3D terrain rendering (1.5x exaggeration).
- **MapTiler Cloud** tiles for high-performance 3D building extrusions.
- **Interactive Camera:** Smooth 60° tilt and rotation for tactical views of La Jolla.

### Real-Time Survival Loop
- **Interactive Epicenter**: Precision lat/lng selection via map click.
- **Wave Propagation**: 15-second animated simulation using a custom Canvas wavefront.
- **Resource Dock**: Strategic deployment of **Ambulances**, **Fire & Rescue**, and **Field Hospitals**.
- **Panic Mode**: Integrated viewport oscillation and emergency red overlays during propagation.

### Performance Analytics
- **Lives Saved**: Calculated via population density and unit proximity.
- **Resource Efficiency**: Metric-based score on optimization.
- **AI Strategic Advisor**: Real-time mission debriefing and tactical insights powered by **Google Gemini**.

---

## 📁 Project Structure

```text
src/
├── app/
│   └── App.tsx                 # Main application entry
├── components/
│   ├── Map/
│   │   ├── MapLibreContainer   # 3D terrain & building logic
│   │   └── GoogleMapContainer  # Tactical overlay interface
│   ├── HUD/
│   │   ├── TopBar.tsx          # Real-time metrics & status
│   │   ├── Sidebar.tsx         # Magnitude & Scenario controls
│   │   └── ResourceDock.tsx    # Unit deployment interaction
│   └── Modals/
│       └── ResultsScreen.tsx   # Mission debrief & AI analysis
├── hooks/
│   ├── useGameManager.ts       # Central State Machine
│   └── useSeismicData.ts       # Impulse AI & Gemini integration
└── utils/
    ├── scoring.ts              # Life-saving algorithms
    └── physics.ts              # Seismic wave constants
```

---

## 🚀 Troubleshooting
* **Map Not Loading:** Ensure `VITE_MAPTILER_KEY` is present in your `.env` and restart the dev server.
* **Google Maps Error:** Confirm that the **Maps JavaScript API** is enabled in your Google Cloud Console for the project associated with your key.
* **3D Building Missing:** Zoom in past level 15; extrusion layers are set to activate for high-detail urban views.

---

## ⚖️ Credits
* **Data Source:** Scripps Institution of Oceanography (Rekoske et al., 2025).
* **Development:** Built by the **Seismic Sentinel Team** for DataHacks 2026.
