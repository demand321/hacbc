"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { fetchRoadRoute, formatDistance, formatDuration } from "@/lib/routing";

interface WaypointData {
  name: string;
  lat: number;
  lng: number;
  note: string;
}

function createNumberedIcon(num: number, active = false) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: ${active ? "#22c55e" : "var(--primary, #dc2626)"};
      color: white;
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 14px;
      border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.5);
      cursor: grab;
    ">${num}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

function ClickHandler({
  onMapClick,
}: {
  onMapClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function DraggableMarker({
  position,
  index,
  name,
  onDragEnd,
}: {
  position: [number, number];
  index: number;
  name: string;
  onDragEnd: (lat: number, lng: number) => void;
}) {
  return (
    <Marker
      position={position}
      icon={createNumberedIcon(index + 1)}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          onDragEnd(pos.lat, pos.lng);
        },
      }}
    >
      <Popup>
        <strong>{name || `Punkt ${index + 1}`}</strong>
        <br />
        <em className="text-xs">Dra for å flytte</em>
      </Popup>
    </Marker>
  );
}

export default function RouteEditor({
  waypoints,
  onChange,
}: {
  waypoints: WaypointData[];
  onChange: (waypoints: WaypointData[]) => void;
}) {
  const [roadRoute, setRoadRoute] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [calculating, setCalculating] = useState(false);

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

  // Recalculate road route when waypoints change
  const calculateRoute = useCallback(async () => {
    if (waypoints.length < 2) {
      setRoadRoute([]);
      setRouteInfo(null);
      return;
    }

    setCalculating(true);
    const points: [number, number][] = waypoints.map((wp) => [wp.lat, wp.lng]);
    const result = await fetchRoadRoute(points);

    if (result) {
      setRoadRoute(result.coordinates);
      setRouteInfo({
        distance: formatDistance(result.distance),
        duration: formatDuration(result.duration),
      });
    } else {
      setRoadRoute(points);
      setRouteInfo(null);
    }
    setCalculating(false);
  }, [waypoints]);

  useEffect(() => {
    const timer = setTimeout(calculateRoute, 500); // Debounce
    return () => clearTimeout(timer);
  }, [calculateRoute]);

  function handleMapClick(lat: number, lng: number) {
    const newWp: WaypointData = {
      name: "",
      lat: Math.round(lat * 100000) / 100000,
      lng: Math.round(lng * 100000) / 100000,
      note: "",
    };
    onChange([...waypoints, newWp]);
  }

  function handleDragEnd(index: number, lat: number, lng: number) {
    const updated = waypoints.map((wp, i) =>
      i === index
        ? {
            ...wp,
            lat: Math.round(lat * 100000) / 100000,
            lng: Math.round(lng * 100000) / 100000,
          }
        : wp
    );
    onChange(updated);
  }

  const center: [number, number] =
    waypoints.length > 0
      ? [waypoints[0].lat, waypoints[0].lng]
      : [60.7945, 11.068];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Klikk på kartet for å legge til stoppesteder. Dra markører for å
          flytte dem. Ruten beregnes automatisk langs veier.
        </p>
        {calculating && (
          <span className="text-xs text-muted-foreground">
            Beregner rute...
          </span>
        )}
      </div>

      {routeInfo && (
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            Avstand: <strong className="text-foreground">{routeInfo.distance}</strong>
          </span>
          <span className="text-muted-foreground">
            Kjøretid: <strong className="text-foreground">{routeInfo.duration}</strong>
          </span>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-border">
        <MapContainer
          center={center}
          zoom={waypoints.length > 0 ? 12 : 11}
          scrollWheelZoom={true}
          style={{ height: "450px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={handleMapClick} />
          {waypoints.map((wp, idx) => (
            <DraggableMarker
              key={`${idx}-${wp.lat}-${wp.lng}`}
              position={[wp.lat, wp.lng]}
              index={idx}
              name={wp.name}
              onDragEnd={(lat, lng) => handleDragEnd(idx, lat, lng)}
            />
          ))}
          {roadRoute.length > 1 && (
            <Polyline
              positions={roadRoute}
              pathOptions={{
                color: "#dc2626",
                weight: 4,
                opacity: 0.8,
              }}
            />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
