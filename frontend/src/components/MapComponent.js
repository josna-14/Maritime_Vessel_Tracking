import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
// Link is no longer needed since we removed the Details button
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { fetchLiveVessels, fetchRiskZones } from "../api/api"; 
import Loader from "./Loader"; 

/* ===================================================
   1. COLOR CODING LOGIC (Ship Categories)
=================================================== */
const getVesselColor = (type) => {
  if (!type) return "#5c6886"; // Grey for Unknown
  const t = type.toLowerCase();
  if (t.includes("tanker") || t.includes("oil")) return "#d32f2f"; // Red (Dangerous)
  if (t.includes("cargo") || t.includes("container") || t.includes("bulk")) return "#2e7d32"; // Green (Commercial)
  if (t.includes("passenger")) return "#0288d1"; // Blue (People)
  if (t.includes("fishing")) return "#f57c00"; // Orange
  if (t.includes("tug") || t.includes("service")) return "#7b1fa2"; // Purple
  return "#1f3c88"; // Navy Default
};

/* ===================================================
   2. CUSTOM ICON GENERATOR (SVG ARROWS)
=================================================== */
const createShipIcon = (course = 0, type) => {
  const color = getVesselColor(type);
  return L.divIcon({
    className: "ship-arrow-icon",
    html: `
      <svg width="34" height="34" viewBox="0 0 100 100" style="transform: rotate(${course}deg); filter: drop-shadow(0px 2px 2px rgba(0,0,0,0.3));">
        <path d="M50 0 L100 100 L50 80 L0 100 Z" fill="${color}" stroke="white" stroke-width="4"/>
      </svg>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

/* ===================================================
   3. ANIMATED MARKER
=================================================== */
function AnimatedMarker({ position, icon, children }) {
  const markerRef = useRef(null);
  const previousPosition = useRef(position);

  useEffect(() => {
    if (!markerRef.current) return;
    const marker = markerRef.current;
    const from = L.latLng(previousPosition.current);
    const to = L.latLng(position);
    
    const duration = 1000;
    const start = performance.now();
    function animate(time) {
      const progress = Math.min((time - start) / duration, 1);
      const lat = from.lat + (to.lat - from.lat) * progress;
      const lng = from.lng + (to.lng - from.lng) * progress;
      marker.setLatLng([lat, lng]);
      if (progress < 1) requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
    previousPosition.current = position;
  }, [position]);

  return <Marker ref={markerRef} position={position} icon={icon}>{children}</Marker>;
}

/* ===================================================
   MAIN MAP COMPONENT
=================================================== */
export default function MapComponent({ center = [20, 0], zoom = 2 }) {
  const [vessels, setVessels] = useState([]);
  const [risks, setRisks] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Risk Zone Colors
  const getRiskColor = (type) => {
    switch (type) {
      case 'WEATHER': return '#ffca28'; // Amber
      case 'PIRACY': return '#212121'; // Black/Dark Grey
      case 'CONGESTION': return '#e53935'; // Red
      default: return '#ffa726';
    }
  };

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        const [vesselsRes, risksRes] = await Promise.all([
          fetchLiveVessels(),
          fetchRiskZones()
        ]);
        
        if (mounted) {
          const vesselList = vesselsRes.vessels ? vesselsRes.vessels : (Array.isArray(vesselsRes) ? vesselsRes : []);
          setVessels(vesselList);
          if (Array.isArray(risksRes)) setRisks(risksRes);
        }
      } catch (err) { console.error("Map Data Error:", err); } 
      finally { if(mounted) setLoading(false); }
    };

    loadData();
    const interval = setInterval(loadData, 10000); 
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="map-wrapper" style={{ height: "80vh", borderRadius: 12, overflow: "hidden", position: "relative", border: "1px solid #e0e0e0" }}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", background: "#aad3df" }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* --- LAYER 1: RISK OVERLAYS (Circles) --- */}
        {risks.map((risk) => (
          <Circle 
            key={risk.id}
            center={[risk.latitude || 0, risk.longitude || 0]}
            pathOptions={{ 
              color: getRiskColor(risk.risk_type), 
              fillColor: getRiskColor(risk.risk_type), 
              fillOpacity: 0.3,
              weight: 1 
            }}
            radius={(risk.radius_km || 20) * 1000} 
          >
             <Popup>
                <div style={{textAlign: "center"}}>
                  <strong style={{color: "#d32f2f"}}>⚠️ {risk.risk_type} ZONE</strong>
                  <hr style={{margin: "5px 0", borderTop: "1px solid #eee"}}/>
                  {risk.description}
                </div>
             </Popup>
          </Circle>
        ))}

        {/* --- LAYER 2: VESSELS (Arrows) --- */}
        {vessels.map((v) => {
          const lat = Number(v.last_position_lat);
          const lon = Number(v.last_position_lon);
          if (isNaN(lat) || isNaN(lon)) return null;

          return (
            <AnimatedMarker
              key={v.mmsi || v.id}
              position={[lat, lon]}
              icon={createShipIcon(v.course, v.type)}
            >
              <Popup className="custom-popup">
                <div style={{ minWidth: "220px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "16px" }}>{v.name}</h3>
                    <span className={`status-chip ${v.speed > 0.5 ? '' : 'docked'}`} style={{fontSize: "10px"}}>
                      {v.speed > 0.5 ? "MOVING" : "ANCHORED"}
                    </span>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "#555" }}>
                    <div><strong>Type:</strong><br/>{v.type}</div>
                    <div><strong>Flag:</strong><br/>{v.flag}</div>
                    <div><strong>Speed:</strong><br/>{v.speed} kn</div>
                    <div><strong>IMO:</strong><br/>{v.imo_number}</div>
                  </div>

                  <hr style={{margin: "10px 0", borderTop: "1px solid #eee"}}/>
                  
                  {/* ✅ UPDATED: Removed "Details" Link, kept only Alert */}
                  <div style={{ marginTop: "10px" }}>
                    <button 
                        className="ghost-btn" 
                        style={{
                            width: "100%", // Full width now that it is alone
                            padding: "5px", 
                            fontSize: "11px", 
                            color: "#d32f2f", 
                            borderColor: "#d32f2f"
                        }}
                    >
                        Alert
                    </button>
                  </div>
                </div>
              </Popup>
            </AnimatedMarker>
          );
        })}
      </MapContainer>
      
      {/* FLOATING LEGEND */}
      <div style={{ position: "absolute", bottom: "20px", right: "20px", background: "white", padding: "15px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 1000, fontSize: "11px", minWidth: "140px" }}>
          <h4 style={{margin: "0 0 10px 0", fontSize: "12px", borderBottom: "1px solid #eee", paddingBottom: "5px"}}>Vessel Types</h4>
          
          <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px"}}>
            <svg width="14" height="14" viewBox="0 0 100 100"><path d="M50 0 L100 100 L50 80 L0 100 Z" fill="#2e7d32" /></svg>
            Cargo / Container
          </div>

          <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px"}}>
            <svg width="14" height="14" viewBox="0 0 100 100"><path d="M50 0 L100 100 L50 80 L0 100 Z" fill="#d32f2f" /></svg>
            Tanker / Hazard
          </div>

          <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px"}}>
            <svg width="14" height="14" viewBox="0 0 100 100"><path d="M50 0 L100 100 L50 80 L0 100 Z" fill="#0288d1" /></svg>
            Passenger
          </div>

          <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px"}}>
            <svg width="14" height="14" viewBox="0 0 100 100"><path d="M50 0 L100 100 L50 80 L0 100 Z" fill="#f57c00" /></svg>
            Fishing
          </div>
          
          <h4 style={{margin: "10px 0 5px 0", fontSize: "12px", borderBottom: "1px solid #eee", paddingBottom: "5px"}}>Risk Zones</h4>
          
          <div style={{display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px"}}>
            <span style={{width: 12, height: 12, background: "#ffca28", borderRadius: "50%", opacity: 0.6, border: "1px solid #cca000"}}></span> 
            Weather Risk
          </div>
          <div style={{display: "flex", alignItems: "center", gap: "8px"}}>
             <span style={{width: 12, height: 12, background: "#e53935", borderRadius: "50%", opacity: 0.6, border: "1px solid #b71c1c"}}></span> 
             Congestion
          </div>
      </div>
    </div>
  );
}