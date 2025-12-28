import React, { useEffect, useState } from "react";
import { fetchDashboardStats } from "../api/api";
import Loader from "../components/Loader";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Cards with UNCTAD and Risk Data
  const cards = [
    { title: "Total Vessels", value: stats?.total_vessels || 0, icon: "🚢", color: "#1f3c88", desc: "Global Tracking" },
    { title: "Active Voyages", value: stats?.active_voyages || 0, icon: "🌍", color: "#2e7d32", desc: "In Transit" },
    { title: "Congestion Alerts", value: stats?.high_congestion_ports || 0, icon: "⚓", color: "#d32f2f", desc: "UNCTAD Analysis" },
    { title: "Risk Zones", value: stats?.active_risks || 0, icon: "⚠️", color: "#f57c00", desc: "Weather & Piracy" },
  ];

  if (loading) return <Loader />;

  return (
    <main className="page">
      {/* HEADER: Changed back to Dashboard */}
      <header className="page__header" style={{display: "flex", justifyContent: "space-between", alignItems: "flex-end"}}>
        <div>
            <h1>Dashboard</h1>
            <p>Real-time Maritime Operations & Congestion Analysis</p>
        </div>
        <div style={{textAlign: "right"}}>
            <span style={{fontSize: "0.85rem", color: "#2e7d32", background: "#e8f5e9", padding: "4px 12px", borderRadius: "20px", fontWeight: "600"}}>● System Operational</span>
        </div>
      </header>

      {/* STATS GRID */}
      <section className="grid grid--stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
        {cards.map((card) => (
          <article key={card.title} className="card card--stat" style={{ borderLeft: `4px solid ${card.color}` }}>
            <div className="card__icon" style={{ fontSize: "2rem", color: card.color }}>{card.icon}</div>
            <div>
              <p className="card__value" style={{ fontSize: "2rem", fontWeight: "700", margin: 0 }}>{card.value}</p>
              <p className="card__label" style={{ margin: 0, fontSize: "0.9rem" }}>{card.title}</p>
              <span style={{fontSize: "0.75rem", color: "#999"}}>{card.desc}</span>
            </div>
          </article>
        ))}
      </section>

      <div className="dashboard-split" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginTop: "20px" }}>
        
        {/* RECENT MOVEMENTS TABLE */}
        <section className="card table-card">
            <div className="card__header" style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between" }}>
                <h3>Recent Movements</h3>
                <Link to="/map" className="ghost-btn" style={{fontSize: "0.8rem", padding: "4px 8px"}}>View Map</Link>
            </div>
            <div className="table-scroll">
            <table style={{ width: "100%", fontSize: "0.9rem" }}>
                <thead>
                <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
                    <th style={{ padding: "12px" }}>Vessel</th>
                    <th style={{ padding: "12px" }}>Origin</th>
                    <th style={{ padding: "12px" }}>Destination</th>
                    <th style={{ padding: "12px" }}>Status</th>
                </tr>
                </thead>
                <tbody>
                {stats?.recent_voyages?.map((voyage) => (
                    <tr key={voyage.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "12px", fontWeight: "500" }}>{voyage.vessel_name}</td>
                    <td style={{ padding: "12px", color: "#666" }}>{voyage.origin}</td>
                    <td style={{ padding: "12px", color: "#666" }}>{voyage.destination}</td>
                    <td style={{ padding: "12px" }}>
                        <span className={`status-chip ${voyage.status === "In Transit" ? "" : "docked"}`}>
                        {voyage.status}
                        </span>
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </section>

        {/* ALERTS PANEL */}
        <section className="card" style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginBottom: "15px" }}>🔔 Live Alerts</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "400px", overflowY: "auto" }}>
                
                {stats?.high_congestion_ports > 0 && (
                    <div className="alert-item high-priority">
                        <div className="alert-title">High Congestion Detected</div>
                        <p>UNCTAD Index &gt; 85% at major hubs.</p>
                        <small>Just now</small>
                    </div>
                )}

                {stats?.active_risks > 0 && (
                     <div className="alert-item medium-priority">
                        <div className="alert-title">Safety Zone Warning</div>
                        <p>Vessels approaching Weather Risk zones.</p>
                        <small>10 mins ago</small>
                    </div>
                )}
                
                <div className="alert-item low-priority">
                    <div className="alert-title">System Update</div>
                    <p>AIS Stream connected successfully.</p>
                    <small>2 hours ago</small>
                </div>

            </div>
        </section>
      </div>
    </main>
  );
}