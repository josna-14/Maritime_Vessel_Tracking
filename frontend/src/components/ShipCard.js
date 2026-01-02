import React from "react";

export default function ShipCard({ vessel }) {
  // Guard clause to prevent "Cannot read properties of undefined" crash
  if (!vessel) return <div className="loader">Loading...</div>;

  return (
    <div className="ship-card">
      <div className="ship-card__header">
        {/* Mapping data from your JSON fields */}
        <h3>{vessel.name || "Unknown Vessel"}</h3>
        <span className="status">{vessel.type || "N/A"}</span>
      </div>
      
      <div className="ship-card__row">
        <span>IMO:</span>
        <span>{vessel.imo_number || "—"}</span>
      </div>
      
      <div className="ship-card__row">
        <span>Flag:</span>
        <span>{vessel.flag || "—"}</span>
      </div>
      
      <div className="ship-card__row">
        <span>Operator:</span>
        <span>{vessel.operator || "—"}</span>
      </div>

      <div className="ship-card__row">
        {/* Your JSON has cargo_type */}
        <span>Cargo:</span>
        <span>{vessel.cargo_type || "—"}</span>
      </div>

      {/* ✅ REMOVED: The "View details" button is gone. 
          The card will now just end here cleanly. */}
    </div>
  );
}