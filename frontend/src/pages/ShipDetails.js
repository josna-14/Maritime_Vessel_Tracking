import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../components/Loader";

export default function ShipDetails() {
  const { id } = useParams(); // Get ID from URL
  const [vessel, setVessel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch individual vessel data
    fetch(`http://127.0.0.1:8000/api/vessels/${id}/`) // Ensure your API supports detail view
      .then(res => {
         // Fallback: If API returns list, find the item (depends on your backend)
         // Assuming standard DRF ModelViewSet here:
         if (!res.ok) throw new Error("Failed to fetch");
         return res.json();
      })
      .then(data => setVessel(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Loader />;
  if (!vessel) return <div className="page"><h3>Vessel not found</h3></div>;

  return (
    <main className="page">
      <header className="page__header">
        <h1>{vessel.name}</h1>
        <p>IMO: {vessel.imo_number} | MMSI: {vessel.mmsi || "N/A"}</p>
      </header>

      <section className="card detail-grid">
        <div>
          <h3>Status</h3>
          <span className={`status-chip ${vessel.speed > 0.5 ? '' : 'docked'}`}>
             {vessel.speed > 0.5 ? "Underway" : "Anchored"}
          </span>
        </div>
        <div>
          <h3>Current Speed</h3>
          <p style={{fontSize: "1.5rem", fontWeight: "bold"}}>{vessel.speed || 0} kn</p>
        </div>
        <div>
          <h3>Coordinates</h3>
          <p>{vessel.last_position_lat?.toFixed(4)}, {vessel.last_position_lon?.toFixed(4)}</p>
        </div>
        <div>
          <h3>Operator</h3>
          <p>{vessel.operator}</p>
        </div>
      </section>

      <section className="card" style={{marginTop: "20px"}}>
         <h3>Vessel Particulars</h3>
         <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px"}}>
            <div><strong>Flag:</strong> {vessel.flag}</div>
            <div><strong>Type:</strong> {vessel.type}</div>
            <div><strong>Cargo Type:</strong> {vessel.cargo_type || "N/A"}</div>
            <div><strong>Last Update:</strong> {new Date(vessel.last_update).toLocaleString()}</div>
         </div>
      </section>

      <div style={{marginTop: "20px", display: "flex", gap: "10px"}}>
        <Link to="/search" className="ghost-btn">← Back to search</Link>
        <Link to="/map" className="ghost-btn">View Live Map</Link>
      </div>
    </main>
  );
}