import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom"; // 1. Import useLocation
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation(); // 2. Get current path
  
  // ✅ Get the role
  const rawRole = localStorage.getItem("userRole");
  const userRole = rawRole ? rawRole.toLowerCase() : "";
  
  const isLoggedIn = !!localStorage.getItem("access_token");

  // 3. HIDE NAVBAR on Login/Register pages
  // We don't want to see the menu when we are trying to log in.
  if (location.pathname === "/" || location.pathname === "/login" || location.pathname === "/register") {
    return null;
  }

  const handleLogout = () => {
    localStorage.clear();
    navigate("/"); // Redirect to Login (which is now "/")
  };

  return (
    <nav className="navbar">
      <div className="navbar__brand">
        <span role="img" aria-label="ship" className="navbar__logo">🚢</span>
        Marine Analytics
      </div>

      <div className="navbar__links">
        {/* 4. CHANGED: Points to /dashboard now */}
        <NavLink to="/dashboard">Dashboard</NavLink>
        
        <NavLink to="/map">Map</NavLink>
        <NavLink to="/search">Vessels</NavLink>
        <NavLink to="/playback">Voyage Replay</NavLink>

        {/* ✅ SHOW FOR ANALYSTS */}
        {userRole === "analyst" && (
          <NavLink to="/analyst" className="special-link">Analyst Hub</NavLink>
        )}

        {/* ✅ SHOW FOR ADMINS */}
        {userRole === "admin" && (
           <NavLink to="/admin-panel" className="nav-link-admin">Admin Control</NavLink>
        )}

        {isLoggedIn ? (
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        ) : (
          <>
            {/* These links are technically hidden by step 3, but good to keep as backup */}
            <NavLink to="/">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}