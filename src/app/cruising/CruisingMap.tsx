"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Popup } from "react-leaflet";
import L from "leaflet";
import { fetchRoadRoute, formatDistance, formatDuration } from "@/lib/routing";

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
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

function createNumberedIcon(num: number) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: var(--primary, #dc2626);
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 13px;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

interface PhotoMarker {
  id: string;
  url: string;
  comment: string | null;
  lat: number;
  lng: number;
}

function createPhotoIcon() {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: #fff;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      border: 2px solid var(--primary, #dc2626);
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    ">📷</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

export default function CruisingMap({
  waypoints,
  onRouteInfo,
  showMarkers = true,
  photoMarkers = [],
}: {
  waypoints: Waypoint[];
  onRouteInfo?: (info: { distance: string; duration: string }) => void;
  showMarkers?: boolean;
  photoMarkers?: PhotoMarker[];
}) {
  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);

  useEffect(() => {
    const linkId = "leaflet-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
  }, []);

  const sortedWaypoints = [...waypoints].sort((a, b) => a.sortOrder - b.sortOrder);

  useEffect(() => {
    if (sortedWaypoints.length < 2) {
      setRoadRoute([]);
      return;
    }

    const points: [number, number][] = sortedWaypoints.map((wp) => [wp.lat, wp.lng]);

    fetchRoadRoute(points).then((result) => {
      if (result) {
        setRoadRoute(result.coordinates);
        if (onRouteInfo) {
          onRouteInfo({
            distance: formatDistance(result.distance),
            duration: formatDuration(result.duration),
          });
        }
      } else {
        // Fallback to straight lines if OSRM fails
        setRoadRoute(points);
      }
    });
  }, [waypoints]); // eslint-disable-line react-hooks/exhaustive-deps

  // Calculate bounds
  const allPoints = roadRoute.length > 0 ? roadRoute : sortedWaypoints.map((wp) => [wp.lat, wp.lng] as [number, number]);
  const center: [number, number] = sortedWaypoints.length > 0
    ? [sortedWaypoints[0].lat, sortedWaypoints[0].lng]
    : [60.7945, 11.068];

  const bounds = allPoints.length > 1
    ? L.latLngBounds(allPoints.map(([lat, lng]) => L.latLng(lat, lng))).pad(0.1)
    : undefined;

  return (
    <MapContainer
      center={center}
      zoom={12}
      bounds={bounds}
      scrollWheelZoom={true}
      style={{ height: "500px", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {showMarkers && sortedWaypoints.map((wp, idx) => (
        <Marker
          key={wp.id}
          position={[wp.lat, wp.lng]}
          icon={createNumberedIcon(idx + 1)}
        >
          <Popup>
            <strong>{wp.name}</strong>
            {wp.note && <><br />{wp.note}</>}
          </Popup>
        </Marker>
      ))}
      {roadRoute.length > 1 && (
        <Polyline
          positions={roadRoute}
          pathOptions={{
            color: "var(--primary, #dc2626)",
            weight: 4,
            opacity: 0.8,
          }}
        />
      )}
      {photoMarkers.map((photo) => (
        <Marker
          key={photo.id}
          position={[photo.lat, photo.lng]}
          icon={createPhotoIcon()}
        >
          <Popup>
            <div style={{ maxWidth: 200 }}>
              <img src={photo.url} alt={photo.comment || "Bilde"} style={{ width: "100%", borderRadius: 4 }} />
              {photo.comment && <p style={{ margin: "4px 0 0", fontSize: 12 }}>{photo.comment}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
