import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./VoyageReplay.css";

// ✅ CHANGED: Point to Render Backend
const API_BASE = "https://maritime-backend-0521.onrender.com/api";
const getHeaders = () => ({
  "Content-Type": "application/json",
});

// ... (Rest of the file logic remains exactly the same below) ...

const shipIcon = L.divIcon({
  className: "replay-ship-icon",
  html: `<div style="background-color: #1f3c88; width: 22px; height: 22px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.5);"></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

// ... (Copy the rest of your Voyagereplay.js file here) ...

const startIcon = L.divIcon({
  className: "start-icon",
  html: `<div style="background: #2e7d32; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const endIcon = L.divIcon({
  className: "end-icon",
  html: `<div style="background: #d32f2f; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if(center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export default function VoyageReplay() {
  const [voyages, setVoyages] = useState([]);
  const [selectedVoyageId, setSelectedVoyageId] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Playback State
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000); // 1000ms = 1x
  const timerRef = useRef(null);

  // 1. Fetch Voyages
  useEffect(() => {
    fetch(`${API_BASE}/voyages/`, { headers: getHeaders() })
      .then(res => res.json())
      .then(data => {
        setVoyages(data);
        if (data.length > 0) setSelectedVoyageId(data[0].id);
      })
      .catch(err => console.error("Error fetching voyages:", err));
  }, []);

  // 2. Fetch Track History
  useEffect(() => {
    if (!selectedVoyageId) return;
    
    setPlaying(false);
    setTracks([]);
    setLoading(true);
    setError("");
    
    fetch(`${API_BASE}/voyage-track/${selectedVoyageId}/`, { headers: getHeaders() })
      .then(res => {
          if (res.status === 404) throw new Error("No track history found.");
          if (!res.ok) throw new Error("Failed to load data.");
          return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
            const sorted = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setTracks(sorted);
            setIndex(0);
        } else {
            setError("No history recorded for this voyage.");
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedVoyageId]);

  // 3. Playback Logic
  useEffect(() => {
    if (playing && tracks.length > 0) {
      timerRef.current = setInterval(() => {
        setIndex(prev => {
          if (prev < tracks.length - 1) return prev + 1;
          setPlaying(false); // Stop at end
          return prev;
        });
      }, speed);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, tracks, speed]);

  // --- CALCULATED VALUES ---
  const hasData = tracks.length > 0;
  const currentPoint = hasData ? tracks[index] : null;
  const position = currentPoint ? [currentPoint.latitude, currentPoint.longitude] : [0,0];
  
  // Route Paths (The "Gradient" Effect)
  const fullPath = tracks.map(t => [t.latitude, t.longitude]);
  const traveledPath = fullPath.slice(0, index + 1); // Dark Line
  const remainingPath = fullPath.slice(index);       // Dashed/Light Line

  // Progress & ETA
  const progress = hasData ? Math.round(((index + 1) / tracks.length) * 100) : 0;
  const stepsRemaining = tracks.length - 1 - index;
  const timeRemainingSeconds = Math.ceil((stepsRemaining * speed) / 1000);
  const etaDisplay = timeRemainingSeconds > 60 
      ? `${Math.floor(timeRemainingSeconds / 60)}m ${timeRemainingSeconds % 60}s` 
      : `${timeRemainingSeconds}s`;

  return (
    <main className="page">
      <header className="page__header">
        <h1>Voyage Replay</h1>
        <p>Historical route analysis and playback</p>
      </header>

      {/* SELECTOR */}
      <section className="card" style={{ marginBottom: "20px", padding: "20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label style={{fontWeight: "bold", color: "#555"}}>SELECT VOYAGE:</label>
            <select 
              value={selectedVoyageId} 
              onChange={(e) => setSelectedVoyageId(e.target.value)}
              style={{padding: "10px", borderRadius: "6px", border: "1px solid #ccc", minWidth: "300px", cursor: "pointer"}}
            >
              {voyages.map(v => (
                <option key={v.id} value={v.id}>
                  {v.vessel_name} ({v.origin} ➝ {v.destination})
                </option>
              ))}
            </select>
        </div>
      </section>

      {/* ERROR STATE */}
      {!loading && error && (
          <div className="card" style={{padding: "40px", textAlign: "center", color: "#d32f2f", background: "#ffebee"}}>
              <h3>⚠️ {error}</h3>
              <p>Run <code>python manage.py generate_history</code> in your backend.</p>
          </div>
      )}

      {/* PLAYER INTERFACE */}
      {!loading && hasData && (
        <>
          <section className="card" style={{ marginBottom: "20px", padding: "20px" }}>
              
             {/* Info Header */}
             <div style={{display:"flex", justifyContent:"space-between", marginBottom:"15px", alignItems: "flex-end"}}>
                <div>
                    <h3 style={{margin: "0 0 5px 0", color: "#1f3c88"}}>{new Date(currentPoint.timestamp).toLocaleString()}</h3>
                    <div style={{fontSize: "0.9rem", color: "#666"}}>
                        Speed: <strong>{currentPoint.speed} kn</strong> | 
                        Lat: {currentPoint.latitude.toFixed(4)}, Lon: {currentPoint.longitude.toFixed(4)}
                    </div>
                </div>
                <div style={{textAlign: "right"}}>
                    <div style={{fontSize: "1.2rem", fontWeight: "bold", color: "#2e7d32"}}>{progress}%</div>
                    {playing && <div style={{fontSize: "0.8rem", color: "#888"}}>Est. Remaining: {etaDisplay}</div>}
                </div>
             </div>

             {/* Progress Bar Slider */}
             <input 
                type="range" 
                min="0" 
                max={tracks.length - 1} 
                value={index} 
                onChange={(e) => setIndex(Number(e.target.value))}
                style={{width: "100%", marginBottom: "20px", cursor: "pointer", accentColor: "#1f3c88"}}
             />

             {/* Controls Row */}
             <div style={{display:"flex", justifyContent:"space-between", alignItems: "center"}}>
                
                {/* Play/Pause/Reset Buttons */}
                <div style={{display: "flex", gap: "10px"}}>
                    {!playing ? (
                        <button 
                            className="ghost-btn" 
                            onClick={() => setPlaying(true)}
                            style={{ background: "#e3f2fd", color: "#1565c0", fontWeight: "bold", minWidth: "100px" }}
                        >
                           ▶ Play
                        </button>
                    ) : (
                        <button 
                            className="ghost-btn" 
                            onClick={() => setPlaying(false)}
                            style={{ background: "#fff3e0", color: "#e65100", fontWeight: "bold", minWidth: "100px" }}
                        >
                           ⏸ Pause
                        </button>
                    )}
                    
                    <button 
                        className="ghost-btn" 
                        onClick={() => { setIndex(0); setPlaying(false); }}
                        style={{ border: "1px solid #ccc", color: "#555" }}
                    >
                        🔁 Reset
                    </button>
                </div>

                {/* Speed Controls (Highlighted Active State) */}
                <div style={{display: "flex", gap: "5px", alignItems: "center"}}>
                    <span style={{fontSize: "0.8rem", fontWeight: "bold", color: "#666", marginRight: "5px"}}>SPEED:</span>
                    {[1000, 500, 250, 125].map((s, i) => {
                        const label = `${Math.pow(2, i)}x`;
                        const isActive = speed === s;
                        return (
                            <button 
                                key={s}
                                onClick={() => setSpeed(s)}
                                style={{
                                    padding: "5px 12px", 
                                    borderRadius: "4px", 
                                    border: isActive ? "none" : "1px solid #ccc", 
                                    background: isActive ? "#1f3c88" : "white", // ✅ Active Highlight
                                    color: isActive ? "white" : "#333",
                                    fontWeight: isActive ? "bold" : "normal",
                                    cursor: "pointer",
                                    fontSize: "0.8rem",
                                    transition: "all 0.2s"
                                }}
                            >
                                {label}
                            </button>
                        );
                    })}
                </div>
             </div>
          </section>

          {/* MAP */}
          <section className="map-wrapper" style={{ height: "550px", borderRadius: "16px", overflow: "hidden", border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            <MapContainer center={position} zoom={6} style={{ height: "100%" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
              
              {/* ✅ 1. REMAINING PATH (Light Grey, Dashed) */}
              <Polyline 
                positions={remainingPath} 
                pathOptions={{ color: "#94a3b8", weight: 3, dashArray: '5, 10', opacity: 0.6 }} 
              />

              {/* ✅ 2. TRAVELED PATH (Dark Blue, Solid) */}
              <Polyline 
                positions={traveledPath} 
                pathOptions={{ color: "#1f3c88", weight: 4 }} 
              />
              
              {/* ✅ 3. START MARKER (Green) */}
              <Marker position={fullPath[0]} icon={startIcon}>
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>Start</Tooltip>
              </Marker>

              {/* ✅ 4. END MARKER (Red) */}
              <Marker position={fullPath[fullPath.length - 1]} icon={endIcon}>
                  <Tooltip direction="top" offset={[0, -10]} opacity={1}>Destination</Tooltip>
              </Marker>

              {/* ✅ 5. MOVING SHIP */}
              <Marker position={position} icon={shipIcon}>
                 <Popup>
                    <div style={{textAlign: "center", minWidth: "120px"}}>
                        <strong style={{color: "#1f3c88"}}>Current Position</strong><hr style={{margin: "5px 0", borderTop: "1px solid #eee"}}/>
                        <div style={{fontSize: "0.9rem"}}>{currentPoint.speed} knots</div>
                        <div style={{fontSize: "0.8rem", color: "#666"}}>{new Date(currentPoint.timestamp).toLocaleTimeString()}</div>
                    </div>
                 </Popup>
                 <MapUpdater center={position} />
              </Marker>

            </MapContainer>
          </section>
        </>
      )}
    </main>
  );
}