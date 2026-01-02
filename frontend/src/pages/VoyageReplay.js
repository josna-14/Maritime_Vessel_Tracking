import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./VoyageReplay.css";

// ✅ 1. Define the API Base URL (Same as your other files)
const API_BASE = "https://celestina-raffish-nayeli.ngrok-free.dev/api";

// ✅ 2. Define Headers to bypass Ngrok warning
const getHeaders = () => ({
  "Content-Type": "application/json",
  "ngrok-skip-browser-warning": "true",
});

// Helper to center map
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if(center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const shipIcon = L.divIcon({
  className: "replay-ship-icon",
  html: `<div style="background-color: #1f3c88; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export default function VoyageReplay() {
  const [voyages, setVoyages] = useState([]);
  const [selectedVoyageId, setSelectedVoyageId] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Playback State
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef(null);

  // 1. Fetch List of Voyages
  useEffect(() => {
    // ✅ CHANGED: Use API_BASE and add Headers
    fetch(`${API_BASE}/voyages/`, { headers: getHeaders() })
      .then(res => res.json())
      .then(data => {
        setVoyages(data);
        if (data.length > 0) setSelectedVoyageId(data[0].id);
      })
      .catch(err => console.error("Error fetching voyages:", err));
  }, []);

  // 2. Fetch Tracks when Voyage Selected
  useEffect(() => {
    if (!selectedVoyageId) return;
    
    setPlaying(false);
    setTracks([]);
    setLoading(true);
    setError("");
    
    // ✅ CHANGED: Use API_BASE and add Headers
    fetch(`${API_BASE}/voyage-track/${selectedVoyageId}/`, { headers: getHeaders() })
      .then(res => {
         if (res.status === 404) throw new Error("No track history found for this voyage.");
         if (!res.ok) throw new Error("Failed to load data.");
         return res.json();
      })
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
            const sorted = data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setTracks(sorted);
            setIndex(0);
        } else {
            setError("No historical track points recorded for this vessel yet.");
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedVoyageId]);

  // 3. Playback Loop
  useEffect(() => {
    if (playing && tracks.length > 0) {
      timerRef.current = setInterval(() => {
        setIndex(prev => {
          if (prev < tracks.length - 1) return prev + 1;
          setPlaying(false);
          return prev;
        });
      }, 500); 
    }
    return () => clearInterval(timerRef.current);
  }, [playing, tracks]);

  const hasData = tracks.length > 0;
  const currentPoint = hasData ? tracks[index] : null;
  const position = currentPoint ? [currentPoint.latitude, currentPoint.longitude] : [0,0];
  const path = tracks.map(t => [t.latitude, t.longitude]);

  return (
    <main className="page">
      <header className="page__header">
        <h1>Voyage Replay</h1>
        <p>Historical route analysis and playback</p>
      </header>

      <section className="card" style={{ marginBottom: "20px", padding: "15px" }}>
        <label style={{fontWeight: "bold", marginRight: "10px"}}>Select Voyage:</label>
        <select 
          value={selectedVoyageId} 
          onChange={(e) => setSelectedVoyageId(e.target.value)}
          style={{padding: "8px", borderRadius: "6px", border: "1px solid #ccc", minWidth: "300px"}}
        >
          {voyages.map(v => (
            <option key={v.id} value={v.id}>
              {v.vessel_name} ({v.origin} ➝ {v.destination})
            </option>
          ))}
        </select>
      </section>

      {/* FEEDBACK MESSAGES */}
      {loading && <div className="card" style={{padding: "40px", textAlign: "center"}}>Loading track data...</div>}
      
      {!loading && error && (
          <div className="card" style={{padding: "40px", textAlign: "center", color: "#d32f2f"}}>
              <h3>⚠️ {error}</h3>
              <p>Run <code>python manage.py generate_history</code> in your backend to create fake history.</p>
          </div>
      )}

      {/* PLAYER & MAP */}
      {!loading && hasData && (
        <>
          <section className="card" style={{marginBottom: "20px"}}>
             <div style={{display:"flex", justifyContent:"space-between", marginBottom:"10px"}}>
                <strong>{new Date(currentPoint.timestamp).toLocaleString()}</strong>
                <span>Speed: {currentPoint.speed} kn</span>
             </div>
             <input 
                type="range" 
                min="0" 
                max={tracks.length - 1} 
                value={index} 
                onChange={(e) => setIndex(Number(e.target.value))}
                style={{width: "100%", marginBottom: "15px"}}
             />
             <div style={{display:"flex", gap:"10px"}}>
                <button className="ghost-btn" onClick={() => setPlaying(!playing)}>
                   {playing ? "⏸ Pause" : "▶ Play"}
                </button>
                <button className="ghost-btn" onClick={() => { setIndex(0); setPlaying(false); }}>
                   ⏹ Reset
                </button>
             </div>
          </section>

          <section className="map-wrapper" style={{ height: "500px", borderRadius: "16px", overflow: "hidden", border: "1px solid #ddd" }}>
            <MapContainer center={position} zoom={6} style={{ height: "100%" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              <Polyline positions={path} color="#3b82f6" weight={4} />
              <Marker position={position} icon={shipIcon}>
                 <Popup>{currentPoint.speed} kn</Popup>
              </Marker>
              <MapUpdater center={position} />
            </MapContainer>
          </section>
        </>
      )}
    </main>
  );
}