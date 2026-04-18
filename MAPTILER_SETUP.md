# MapTiler Setup Instructions

## Quick Start

The application uses **MapLibre GL JS** with **MapTiler** for 3D terrain rendering.

### Step 1: Get Your MapTiler API Key (Free Tier)

1. Visit [MapTiler Cloud](https://cloud.maptiler.com/auth/widget)
2. Sign up for a free account (no credit card required)
3. Navigate to **Account** → **Keys**
4. Copy your default API key

### Step 2: Update the API Key in Your Code

Open `src/components/Map/MapLibreContainer.tsx` and replace the placeholder key in **TWO locations**:

#### Location 1: Map Style (Line ~32)
```typescript
style: `https://api.maptiler.com/maps/basic-v2/style.json?key=YOUR_KEY_HERE`,
```

#### Location 2: Terrain Source (Line ~48)
```typescript
url: 'https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=YOUR_KEY_HERE',
```

Replace `get_your_own_OpIi9ZULNHzrESv6T2vL` with your actual MapTiler API key in both places.

### Step 3: Verify It Works

1. The map should load with 3D terrain
2. You should see buildings in 3D when zoomed in
3. The map should tilt at a 60-degree angle by default

## MapTiler Free Tier

The free tier includes:
- **100,000 map loads per month**
- 3D terrain support
- No credit card required for development
- Perfect for this application's usage

## Troubleshooting

### Map Not Loading
- Check browser console for API key errors
- Verify you've replaced the key in BOTH locations
- Ensure your API key is active in MapTiler dashboard

### No 3D Terrain
- Make sure exaggeration is set: `setTerrain({ source: 'terrain', exaggeration: 1.5 })`
- Verify the terrain source URL has your API key
- Check that terrain tiles are loading in Network tab

### Performance Issues
- 3D rendering requires WebGL support
- Reduce `pitch` value for better performance
- Lower `exaggeration` value if terrain is too extreme

## Alternative: Use Your Own Tiles

For complete privacy (no tracking), you can self-host tiles:

1. Download terrain tiles from [OpenMapTiles](https://openmaptiles.org/)
2. Set up a tile server (e.g., TileServer GL)
3. Update the style and terrain URLs to point to your server

## Features Enabled

- **3D Terrain**: RGB terrain tiles with 1.5x exaggeration
- **3D Buildings**: Extruded building footprints
- **Sky Atmosphere**: Realistic sky gradient
- **Navigation Controls**: Zoom, rotation, tilt
- **Fullscreen Mode**: Built-in fullscreen toggle

## Additional Resources

- [MapLibre GL JS Documentation](https://maplibre.org/maplibre-gl-js/docs/)
- [MapTiler Documentation](https://docs.maptiler.com/)
- [3D Terrain Guide](https://docs.maptiler.com/maplibre-gl-js/3d-terrain/)
