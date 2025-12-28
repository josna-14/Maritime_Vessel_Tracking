import { Marker } from "react-leaflet";
import { useEffect, useRef } from "react";
import L from "leaflet";

/**
 * Smoothly animates marker position when coordinates change
 */
export default function AnimatedMarker({ position, icon, children }) {
  const markerRef = useRef(null);
  const previousPosition = useRef(position);

  useEffect(() => {
    if (!markerRef.current) return;

    const marker = markerRef.current;
    const from = L.latLng(previousPosition.current);
    const to = L.latLng(position);

    const duration = 1000; // 1 second animation
    const start = performance.now();

    function animate(time) {
      const progress = Math.min((time - start) / duration, 1);
      const lat = from.lat + (to.lat - from.lat) * progress;
      const lng = from.lng + (to.lng - from.lng) * progress;

      marker.setLatLng([lat, lng]);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
    previousPosition.current = position;
  }, [position]);

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      {children}
    </Marker>
  );
}
