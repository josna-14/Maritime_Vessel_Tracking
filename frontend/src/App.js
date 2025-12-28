import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

// --- Import Pages ---
import Dashboard from "./pages/Dashboard";
import MapView from "./pages/MapView";
import VesselSearch from "./pages/VesselSearch";
import ShipDetails from "./pages/ShipDetails";
import VoyageReplay from "./pages/VoyageReplay";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AnalystDashboard from "./pages/AnalystDashboard"; 
import AdminPanel from "./pages/AdminPanel"; // ✅ You already have this import

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="app-container">
        <Routes>
          {/* Main Dashboard */}
          <Route path="/" element={<Dashboard />} />
          
          {/* Map & Tracking */}
          <Route path="/map" element={<MapView />} />
          <Route path="/search" element={<VesselSearch />} />
          <Route path="/ship/:id" element={<ShipDetails />} />
          <Route path="/playback" element={<VoyageReplay />} />
          
          {/* Authentication */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Analyst Hub */}
          <Route path="/analyst" element={<AnalystDashboard />} />
          
          {/* ✅ ADD THIS MISSING ROUTE */}
          <Route path="/admin-panel" element={<AdminPanel />} />
          
        </Routes>
      </div>
    </BrowserRouter>
  );
}