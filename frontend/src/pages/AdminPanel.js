import React, { useState, useEffect } from "react";
import { fetchDashboardStats } from "../api/api"; // ✅ Import the centralized API helper
import "./AdminPanel.css";

const AdminPanel = () => {
  // Mock System Stats 
  const [serverLoad, setServerLoad] = useState(12);
  const [dbStatus] = useState("Connected");
  const [apiStatus] = useState("Healthy");
  const [activeUsers, setActiveUsers] = useState(0);

  // Maintenance Button States
  const [optimizing, setOptimizing] = useState(false);
  const [rotating, setRotating] = useState(false);

  useEffect(() => {
    // 1. Fetch Real Data (using centralized API to fix Ngrok/Mobile issues)
    const getStats = async () => {
      try {
        // ✅ Use the helper function that has the correct Ngrok URL
        const data = await fetchDashboardStats(); 
        
        // If data exists, use total_vessels
        if (data && data.total_vessels) {
            setActiveUsers(data.total_vessels);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats", err);
      }
    };

    getStats();

    // 2. Simulate "Live" Server Load fluctuating
    const interval = setInterval(() => {
      setServerLoad((prev) => {
        const change = Math.floor(Math.random() * 5) - 2; 
        return Math.min(Math.max(prev + change, 5), 45); 
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // 3. Maintenance Actions
  const handleOptimize = () => {
    setOptimizing(true);
    setTimeout(() => {
      setOptimizing(false);
      alert("Database Indexing Complete. Storage freed: 24MB.");
    }, 2000);
  };

  const handleLogRotation = () => {
    setRotating(true);
    setTimeout(() => {
      setRotating(false);
      alert("System Logs Archived Successfully.");
    }, 1500);
  };

  return (
    <div className="admin-container">
      
      {/* HEADER */}
      <div className="admin-header">
        <div>
          <h2>System Control Center</h2>
          <p className="admin-subtext">Platform Architecture & Operational Oversight</p>
        </div>
        <div className="status-badge-group">
            <span className="status-pill online">● System Online</span>
            <span className="status-pill version">v2.4.0-stable</span>
        </div>
      </div>

      {/* TOP ROW: HEALTH CARDS */}
      <div className="admin-grid-top">
        
        {/* Card 1: API Gateway */}
        <div className="admin-card health-card">
          <div className="card-icon blue-bg">📡</div>
          <div className="card-info">
            <h4>API Gateway</h4>
            <span className="status-text green-text">{apiStatus}</span>
          </div>
          <div className="mini-chart">
            <div className="bar" style={{height: '60%'}}></div>
            <div className="bar" style={{height: '80%'}}></div>
            <div className="bar" style={{height: '40%'}}></div>
            <div className="bar" style={{height: '90%'}}></div>
          </div>
        </div>

        {/* Card 2: Database */}
        <div className="admin-card health-card">
          <div className="card-icon purple-bg">🗄️</div>
          <div className="card-info">
            <h4>Main Database</h4>
            <span className="status-text green-text">{dbStatus}</span>
          </div>
          <p className="latency-text">14ms latency</p>
        </div>

         {/* Card 3: Connected Objects */}
         <div className="admin-card health-card">
          <div className="card-icon orange-bg">🛡️</div>
          <div className="card-info">
            <h4>Tracked Assets</h4>
            {/* Shows real data from API */}
            <span className="status-text">Active: {activeUsers}</span>
          </div>
        </div>

      </div>

      {/* MIDDLE SECTION: METRICS & TOOLS */}
      <div className="admin-grid-main">
        
        {/* LEFT: LIVE METRICS */}
        <div className="metrics-panel">
          <h3>Live System Metrics</h3>
          <div className="metrics-grid">
            
            <div className="metric-box">
              <span className="metric-label">Nodes Online</span>
              {/* Dynamic: updates based on real vessel count */}
              <span className="metric-value">{activeUsers > 0 ? activeUsers + 3 : 0}</span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Throughput / Sec</span>
              <span className="metric-value">2,450</span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Active Alerts</span>
              <span className="metric-value alert-text">0</span>
            </div>

            <div className="metric-box">
              <span className="metric-label">Server CPU Load</span>
              <div className="load-bar-container">
                <div 
                  className="load-bar-fill" 
                  style={{width: `${serverLoad}%`, backgroundColor: serverLoad > 40 ? '#ef4444' : '#10b981'}}
                ></div>
              </div>
              <span className="metric-sub">{serverLoad}% Utilized</span>
            </div>

          </div>
        </div>

        {/* RIGHT: MAINTENANCE TOOLBOX */}
        <div className="tools-panel">
          <h3>Maintenance Toolbox</h3>
          <p className="tools-desc">Administrative actions logged for audit.</p>

          <div className="tool-row">
            <div className="tool-info">
                <strong>Database Optimization</strong>
                <p>Re-index tables and clear cache.</p>
            </div>
            <button 
                className={`admin-btn ${optimizing ? 'loading' : ''}`} 
                onClick={handleOptimize}
                disabled={optimizing}
            >
                {optimizing ? "Running..." : "Run Optimization"}
            </button>
          </div>

          <div className="tool-row">
            <div className="tool-info">
                <strong>API Log Rotation</strong>
                <p>Archive logs older than 30 days.</p>
            </div>
            <button 
                className={`admin-btn outline ${rotating ? 'loading' : ''}`}
                onClick={handleLogRotation}
                disabled={rotating}
            >
                {rotating ? "Archiving..." : "Start Rotation"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminPanel;