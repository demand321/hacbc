"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sortOrder: number;
  note: string | null;
}

// Fix default marker icons for Leaflet in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export default function CruisingMap({
  waypoints,
}: {
  waypoints: Waypoint[];
}) {
  useEffect(() => {
    // Load Leaflet CSS
    const linkId = "leaflet-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  const center: [number, number] = [60.7945, 11.068];
  const sortedWaypoints = [...waypoints].sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
  const polylinePositions: [number, number][] = sortedWaypoints.map((wp) => [
    wp.lat,
    wp.lng,
  ]);

  return (
    <MapContainer
      center={center}
      zoom={12}
      scrollWheelZoom={true}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {sortedWaypoints.map((wp) => (
        <Marker key={wp.id} position={[wp.lat, wp.lng]}>
          <Popup>
            <strong>{wp.name}</strong>
            {wp.note && <br />}
            {wp.note}
          </Popup>
        </Marker>
      ))}
      {polylinePositions.length > 1 && (
        <Polyline
          positions={polylinePositions}
          pathOptions={{ color: "#dc2626", weight: 4 }}
        />
      )}
    </MapContainer>
  );
}
