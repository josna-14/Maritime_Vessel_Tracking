import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  
  // ✅ Get the role
  const rawRole = localStorage.getItem("userRole");
  // Normalize to lowercase for safer comparison (handles "Admin", "admin", "ADMIN")
  const userRole = rawRole ? rawRole.toLowerCase() : "";
  
  const isLoggedIn = !!localStorage.getItem("access_token");

  // Debugging: Check your console (F12) to see what your role actually is!
  console.log("Current Logged In Role:", rawRole);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span role="img" aria-label="ship" className="navbar__logo">🚢</span>
        Marine Analytics
      </div>

      <div className="navbar__links">
        <NavLink to="/" end>Dashboard</NavLink>
        <NavLink to="/map">Map</NavLink>
        <NavLink to="/search">Vessels</NavLink>
        <NavLink to="/playback">Voyage Replay</NavLink>

        {/* ✅ SHOW FOR ANALYSTS */}
        {userRole === "analyst" && (
          <NavLink to="/analyst" className="special-link">Analyst Hub</NavLink>
        )}

        {/* ✅ SHOW FOR ADMINS (Case Insensitive) */}
        {userRole === "admin" && (
           <NavLink to="/admin-panel" className="nav-link-admin">Admin Control</NavLink>
        )}

        {isLoggedIn ? (
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}