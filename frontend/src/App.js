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
import AdminPanel from "./pages/AdminPanel"; 

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="app-container">
        <Routes>
          {/* ✅ CHANGE 1: Login is now the default ("/") path */}
          <Route path="/" element={<Login />} />

          {/* ✅ CHANGE 2: Dashboard is moved to "/dashboard" */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Map & Tracking */}
          <Route path="/map" element={<MapView />} />
          <Route path="/search" element={<VesselSearch />} />
          <Route path="/ship/:id" element={<ShipDetails />} />
          <Route path="/playback" element={<VoyageReplay />} />
          
          {/* Authentication */}
          {/* You can keep /login as an alias if you want, or remove it since "/" is now login */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Analyst Hub */}
          <Route path="/analyst" element={<AnalystDashboard />} />
          
          <Route path="/admin-panel" element={<AdminPanel />} />
          
        </Routes>
      </div>
    </BrowserRouter>
  );
}