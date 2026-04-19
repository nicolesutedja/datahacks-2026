# SeismicStabilize

**SeismicStabilize** is an interactive educational platform designed to simulate earthquake propagation and teach effective mitigation strategies. By combining real-time wave physics with tactical urban planning, the tool educates users on the critical importance of soil stabilization and structural shoring.

This project is a tactical, educational gaming platform made by NJ Squared Team at DataHacks 2026.
The tool is designed to teach users how to mitigate earthquake damage through real-time simulation, wave propagation analysis, and structural engineering tasks.

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
VITE_MAPBOX_TOKEN=your_mapbox_token_here

# --- AI & Immersive Intelligence ---
# Get at aistudio.google.com
VITE_GEMINI_API_KEY=your_gemini_key_here

# Get at elevelabs.io
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key_here

```

### 3. Local Development
Start the Vite development server. **Note:** If you change your `.env` file, you must restart this process.

```bash
npm run dev
```

## 🚀 Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Mapping & 3D:** Mapbox GL JS
- **Animations:** Framer Motion
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Backend:** Python (FastAPI/Flask) for ML wave-surrogate modeling


## ⚖️ Credits
* **Data Source:** Scripps Institution of Oceanography (Rekoske et al., 2025).
* **Development:** Built by the **NJ Squared Team** for DataHacks 2026.
