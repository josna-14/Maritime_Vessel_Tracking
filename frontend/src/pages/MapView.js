import React from "react";
import MapComponent from "../components/MapComponent"; // Check your file path

export default function MapView() {
  return (
    <main className="page">
      <header className="page__header">
        <h1>Interactive Ship Map</h1>
      </header>
      <section className="map-wrapper">
        {/* Call the actual map component here */}
        <MapComponent center={[25, 25]} zoom={4} />
      </section>
    </main>
  );
}