/**
 * Fetch road-based route geometry from OSRM (free, no API key needed).
 * Takes an array of [lat, lng] waypoints and returns an array of [lat, lng]
 * coordinates that follow actual roads.
 */
export async function fetchRoadRoute(
  waypoints: [number, number][]
): Promise<{ coordinates: [number, number][]; distance: number; duration: number } | null> {
  if (waypoints.length < 2) return null;

  // OSRM uses lng,lat order
  const coords = waypoints.map(([lat, lng]) => `${lng},${lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;

    const route = data.routes[0];
    // GeoJSON returns [lng, lat], we need [lat, lng] for Leaflet
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );

    return {
      coordinates,
      distance: route.distance, // meters
      duration: route.duration, // seconds
    };
  } catch {
    return null;
  }
}

/**
 * Fetch route between just two points, useful for getting route options
 * between consecutive waypoints.
 */
export async function fetchSegmentRoute(
  from: [number, number],
  to: [number, number]
): Promise<{ coordinates: [number, number][]; distance: number; duration: number } | null> {
  return fetchRoadRoute([from, to]);
}

/**
 * Format distance in meters to a readable string.
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Format duration in seconds to a readable string.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}t ${remainMins}min`;
}
