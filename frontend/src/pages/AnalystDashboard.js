import React, { useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import "./AnalystDashboard.css";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AnalystDashboard = () => {
  const [downloading, setDownloading] = useState(false);

  // --- DATA: Traffic Flow Trend (Line Chart) ---
  const trafficData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Active Vessels",
        data: [12, 19, 15, 25, 22, 30],
        borderColor: "#0056b3", // Brighter Marine Blue
        backgroundColor: "rgba(0, 86, 179, 0.1)",
        borderWidth: 3,
        pointBackgroundColor: "#fff",
        pointBorderColor: "#0056b3",
        pointRadius: 5,
        tension: 0.4, // Smooth curves
        fill: true,
      },
    ],
  };

  const trafficOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1e293b",
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 14 },
      },
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: "#f1f5f9" },
        ticks: { color: "#64748b" }
      },
      x: { 
        grid: { display: false },
        ticks: { color: "#64748b" }
      },
    },
  };

  // --- DATA: Fleet Composition (Vertical Bar Chart) ---
  const fleetData = {
    labels: ["Bulker", "Cargo", "Container", "Passenger", "Tanker", "Tug"],
    datasets: [
      {
        label: "Fleet Count",
        data: [12, 9, 9, 4, 5, 11],
        backgroundColor: [
          "#94a3b8", // Grey
          "#0284c7", // Blue
          "#38bdf8", // Light Blue
          "#fbbf24", // Yellow
          "#f87171", // Red
          "#fb923c", // Orange
        ],
        borderRadius: 8, // Rounded bars
        barThickness: 40, // Thicker bars
      },
    ],
  };

  // ✅ Changed to Vertical Graph
  const fleetOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: { 
        beginAtZero: true,
        grid: { color: "#f1f5f9" },
        ticks: { color: "#64748b" }
      },
      x: { 
        grid: { display: false },
        ticks: { color: "#64748b", font: { weight: "600" } }
      },
    },
  };

  // --- 🛠️ WORKING FEATURES: Export Functions ---
  
  const handleExportCSV = () => {
    // 1. Create CSV Content
    const headers = "Month,Active Vessels\n";
    const rows = trafficData.labels.map((month, index) => 
      `${month},${trafficData.datasets[0].data[index]}`
    ).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + headers + rows;

    // 2. Trigger Download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "traffic_flow_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSummary = () => {
    setDownloading(true);
    // Simulate a "Processing" delay for realism
    setTimeout(() => {
        const headers = "Category,Count\n";
        const rows = fleetData.labels.map((label, index) => 
            `${label},${fleetData.datasets[0].data[index]}`
        ).join("\n");
        const csvContent = "data:text/csv;charset=utf-8," + headers + rows;

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "fleet_performance_summary.csv");
        document.body.appendChild(link);
        link.click();
        
        setDownloading(false);
    }, 1500);
  };

  return (
    <div className="analyst-container">
      
      {/* --- HEADER --- */}
      <div className="analyst-header">
        <div>
          <h2>Analyst Hub</h2>
          <p className="header-subtext">Real-time operational intelligence and reporting.</p>
        </div>
        <span className="live-badge">● Live Data</span>
      </div>
      
      <div className="analyst-grid">
        
        {/* --- LEFT COLUMN: METRICS --- */}
        <div className="left-panel">
            
            {/* Card 1: Traffic Trends */}
            <div className="metric-card">
              <div className="card-header">
                <h3>Traffic Flow Trend</h3>
                <span className="card-badge">6 Months</span>
              </div>
              <p className="subtext">Active vessels detected in maritime hubs.</p>
              <div className="chart-wrapper line-chart-container">
                <Line data={trafficData} options={trafficOptions} />
              </div>
            </div>

            {/* Card 2: Fleet Composition (Vertical) */}
            <div className="metric-card">
              <div className="card-header">
                <h3>Fleet Composition</h3>
                <span className="card-badge">Distribution</span>
              </div>
              <p className="subtext">Current fleet breakdown by vessel category.</p>
              <div className="chart-wrapper bar-chart-container">
                <Bar data={fleetData} options={fleetOptions} />
              </div>
            </div>
        </div>

        {/* --- RIGHT COLUMN: REPORTS --- */}
        <div className="right-panel">
            
            <div className="report-section-header">
                <h3>Advanced Reporting</h3>
                <p>Generate compliant data exports.</p>
            </div>

            {/* Export Card 1 */}
            <div className="report-card">
              <div className="icon-box blue-icon">📄</div>
              <div className="report-content">
                  <h4>Historical Traffic Data</h4>
                  <p>CSV export of vessel movement logs.</p>
                  <button className="export-btn primary" onClick={handleExportCSV}>
                     Download CSV
                  </button>
              </div>
            </div>

            {/* Export Card 2 */}
            <div className="report-card">
              <div className="icon-box green-icon">📊</div>
              <div className="report-content">
                  <h4>Performance Summary</h4>
                  <p>Aggregated fleet performance metrics.</p>
                  <button 
                    className={`export-btn secondary ${downloading ? 'loading' : ''}`} 
                    onClick={handleExportSummary}
                    disabled={downloading}
                  >
                     {downloading ? "Generating..." : "Download Report"}
                  </button>
              </div>
            </div>

            {/* Helper Card */}
            <div className="info-card">
                <h4>💡 Analyst Note</h4>
                <p>Data is refreshed every 24 hours. For real-time AIS raw data, please contact the Data Engineering team.</p>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AnalystDashboard;