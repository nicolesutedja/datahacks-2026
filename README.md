# TECHTonic

**TECHTonic** is an interactive, gamified educational platform designed to simulate earthquake propagation and teach effective emergency response and mitigation strategies using Scripps Geophysics Data in Southern California. By combining real-time wave physics with tactical asset deployment, the tool helps users understand how earthquakes impact different regions and the critical importance of strategic disaster management.

##  Key Features
- **Dynamic Seismic Simulation**: Users can trigger realistic earthquakes from M5.0 to M9.0, complete with real-time visual wave propagation across an interactive 3D map.
- **Tactical Resource Management**: Players must strategically manage a $10,000,000 budget to deploy specific soil. The effectiveness of these assets decays the further they are placed from the epicenter.
- **AI-Powered Exploration & Debriefs**: Users must click "Unexplored Zones" based on real coordinate locations to run a Gemini AI population information and other factors before deploying assets. 
- **Advanced Geophysical & Socio-Economic Telemetry**: The simulation calculates highly realistic post-action metrics, including Peak Ground Velocity, aftershock probabilities, estimated economic losses (in billions), and the number of displaced persons.

---
## 🛠️ Getting Started
Follow these steps to run a local copy.

### 1. Installation
Clone the repository and install the dependencies.

```bash
# Clone the repository
git clone [https://github.com/nicolesutedja/datahacks-2026.git](https://github.com/nicolesutedja/datahacks-2026.git)
cd datahacks-2026

# Install dependencies
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory. This is critical for the 3D map rendering and AI integrations.

```bash
VITE_MAPBOX_TOKEN=your_mapbox_token_here
VITE_GEMINI_API_KEY=your_gemini_key_here
VITE_ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

### 3. Local Development
Start the Vite development server. **Note:** If you change your `.env` file, you must restart this process.

```bash
npm run dev
```

---

## 🚀 Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Mapping & 3D:** Mapbox GL JS (for interactive 3D mapping)
- **Animations:** Framer Motion (for dynamic visual feedback)
- **Styling:** Tailwind CSS (for the tactical UI)
- **Icons:** Lucide React
- **Backend:** Python (FastAPI) for simulation APIs
- **Machine Learning:** A surrogate model approximating seismic wave propagation
- **AI Integration:** Google Gemini API for region scanning and tactical debriefs
- **Audio:** ElevenLabs API for immersive sound design

---

## 🌊 Data (Scripps)

- **Direct Use of Scripps Seismic Data:** TECHTonic is built on a high-resolution earthquake simulation dataset from the Scripps Institution of Oceanography (Rekoske et al., 2025), which provides velocity seismograms recorded across multiple receivers for hundreds of earthquake source locations.
- **Learning Spatial Earthquake Behavior:** We use the dataset’s source location data and corresponding waveforms to understand how seismic waves change across geography. This allows our system to generalize how earthquakes propagate in different regions, rather than relying on fixed or pre-scripted patterns.
- **Interpolating Between Real Data Points:** Instead of treating the dataset as static samples, we use it to interpolate between known earthquake scenarios. This means when a user selects a new epicenter, the simulation generates behavior that is consistent with patterns learned directly from the Scripps data.
- **Reconstructing Realistic Waveforms:** The dataset’s seismograms are used as the foundation for reconstructing full wave signals at new locations, ensuring that the simulated waves users see are grounded in real physical patterns observed in the original data.
- **Driving Impact and Risk Metrics:** All downstream calculations such as Peak Ground Velocity (PGV), hazard zones, and damage estimates are derived from the dataset-informed wave outputs. This ensures that gameplay outcomes reflect realistic seismic behavior encoded in the Scripps data.

## 🧗 Challenges We Faced
One of our biggest challenges was collaboration. With multiple team members working simultaneously, we encountered frequent Git merge conflicts. This forced us to improve our communication and coordinate more effectively as a team.

We also faced significant technical hurdles in integrating the Python/FastAPI backend simulation with the React/Mapbox frontend visualization pipeline in real-time, ensuring the wave propagation matched the mathematical models accurately.

---

## 🏆 Accomplishments That We're Proud Of
- We created a highly immersive, tactical UI/UX that feels intuitive and engaging.
- We successfully integrated complex animations and dynamic visual feedback for realism.
- We combined machine learning, geospatial systems, and generative AI into one cohesive experience.
- We built a tool that is both educational and interactive, bridging the gap between theoretical data and practical understanding.

---

## 🧠 What We Learned
This project pushed us beyond just coding:
- We learned how to collaborate effectively under pressure in a hackathon environment.
- We improved our full-stack debugging and system integration skills.
- We learned how to translate complex seismological data into intuitive, actionable visual experiences.
- We grew in our ability to build meaningful, user-centered tools with a real-world purpose.

---

## 🔮 What's Next for TECHTonic
We see this as just the beginning. Our next steps include:
- **Expanding Geographies:** Bringing simulations beyond Southern California to other seismically active states and regions globally.
- **More Activities:** Adding more advanced emergency response scenarios, varying resource types, and complex urban planning challenges for users to navigate.
- **Improved Realism:** Further refining the ML surrogate accuracy to match historical earthquake data even more closely.

Our ultimate goal is to evolve TECHTonic into a platform that not only educates but actively helps individuals and communities prepare for real-world disasters.

---

## ⚖️ Credits
* **Data Source:** Scripps Institution of Oceanography (Rekoske et al., 2025).
* **Development:** Built by the **NJ Squared Team** for DataHacks 2026.
