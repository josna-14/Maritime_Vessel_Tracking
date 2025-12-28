import React, { useEffect, useState } from "react";
import axios from "axios";
import ShipCard from "../components/ShipCard";
import Loader from "../components/Loader";

export default function VesselSearch() {
  const [vessels, setVessels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedFlag, setSelectedFlag] = useState("All Flags");

  useEffect(() => {
    setLoading(true);
    axios.get("http://127.0.0.1:8000/api/vessels/")
      .then((res) => {
        if (res.data && res.data.vessels) {
          setVessels(res.data.vessels);
        }
      })
      .catch(err => console.error("Search fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  // 1. DYNAMIC FLAG LIST (Existing logic)
  const uniqueFlags = ["All Flags", ...new Set(vessels.map(v => v.flag).filter(Boolean))].sort();

  // 2. DYNAMIC TYPE LIST (New logic: Scans data for available types only)
  // We filter(Boolean) to remove null/undefined/empty types
  const uniqueTypes = ["All Types", ...new Set(vessels.map(v => v.type).filter(Boolean))].sort();

  // 3. Filter Logic
  const filtered = vessels.filter(ship => {
    const matchesSearch = (ship.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           ship.imo_number?.includes(searchTerm));
    
    // Exact match for type (unless "All Types")
    const matchesType = selectedType === "All Types" || ship.type === selectedType;

    // Exact match for flag (unless "All Flags")
    const matchesFlag = selectedFlag === "All Flags" || ship.flag === selectedFlag;

    return matchesSearch && matchesType && matchesFlag;
  });

  if (loading) return <Loader />;

  return (
    <main className="page">
      <header className="page__header">
        <h1>Vessel Search</h1>
        <p>Tracking {filtered.length} vessels globally</p>
      </header>
      
      {/* FILTER BAR */}
      <section className="card" style={{ marginBottom: "20px", padding: "15px" }}>
        <div className="filters" style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          
          {/* Search Input */}
          <div style={{ flex: 2, minWidth: "250px" }}>
             <label style={{display:"block", marginBottom:"5px", fontSize:"0.85rem", fontWeight:"600"}}>Search</label>
             <input 
              type="text" 
              placeholder="Search by vessel name or IMO..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
            />
          </div>

          {/* Type Dropdown (Now Dynamic) */}
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{display:"block", marginBottom:"5px", fontSize:"0.85rem", fontWeight:"600"}}>Vessel Type</label>
            <select 
              value={selectedType} 
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "white" }}
            >
              {/* This map now only shows types that actually exist in your DB */}
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Flag Dropdown */}
          <div style={{ flex: 1, minWidth: "150px" }}>
            <label style={{display:"block", marginBottom:"5px", fontSize:"0.85rem", fontWeight:"600"}}>Flag Registry</label>
            <select 
              value={selectedFlag} 
              onChange={(e) => setSelectedFlag(e.target.value)}
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", background: "white" }}
            >
              {uniqueFlags.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

        </div>
      </section>

      {/* RESULTS GRID */}
      <section className="grid grid--cards">
        {filtered.length > 0 ? (
          filtered.map((ship) => <ShipCard key={ship.id} vessel={ship} />)
        ) : (
          <div style={{gridColumn: "1/-1", textAlign:"center", padding:"40px", color:"#888"}}>
            No vessels found matching your filters.
          </div>
        )}
      </section>
    </main>
  );
}