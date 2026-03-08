"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin, Clock, Ruler, Calendar, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sortOrder: number;
  note: string | null;
}

interface CruisingRoute {
  id: string;
  title: string;
  description: string | null;
  waypoints: Waypoint[];
}

interface CruisingPhoto {
  id: string;
  url: string;
  comment: string | null;
  uploadedBy: { name: string };
}

interface CruisingEvent {
  id: string;
  date: string;
  title: string;
  description: string | null;
  route: CruisingRoute | { title: string } | null;
  photos?: CruisingPhoto[];
}

interface CruisingData {
  routes: CruisingRoute[];
  upcoming: CruisingEvent[];
  past: CruisingEvent[];
}

const CruisingMap = dynamic(() => import("./CruisingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-xl bg-muted">
      <div className="text-muted-foreground">Laster kart...</div>
    </div>
  ),
});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CruisingPage() {
  const [data, setData] = useState<CruisingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<CruisingRoute | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<CruisingPhoto | null>(null);

  useEffect(() => {
    fetch("/api/cruising")
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        // Show first upcoming event's route, or first active route
        if (d.upcoming.length > 0 && d.upcoming[0].route && "waypoints" in d.upcoming[0].route) {
          setSelectedRoute(d.upcoming[0].route);
        } else if (d.routes.length > 0) {
          setSelectedRoute(d.routes[0]);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold uppercase tracking-tight sm:text-5xl">
        <span className="text-primary">Cruising</span>
      </h1>
      <p className="mt-4 text-muted-foreground">
        Cruising i Hamar-regionen. Se kommende turer, ruter og bilder fra
        tidligere cruising.
      </p>

      {loading ? (
        <div className="mt-8 flex h-[500px] items-center justify-center rounded-xl bg-muted">
          <div className="text-muted-foreground">Laster...</div>
        </div>
      ) : !data ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <MapPin className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Ingen cruising-data</h2>
          <p className="mt-2 text-muted-foreground">Sjekk tilbake senere!</p>
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {/* Upcoming events */}
          {data.upcoming.length > 0 && (
            <section>
              <h2 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-bold uppercase">
                Kommende <span className="text-primary">cruising</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.upcoming.map((event) => (
                  <Card
                    key={event.id}
                    className="cursor-pointer border-border transition-colors hover:border-primary/50"
                    onClick={() => {
                      if (event.route && "waypoints" in event.route) {
                        setSelectedRoute(event.route);
                        setRouteInfo(null);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                          <span className="text-xs font-bold uppercase leading-none">
                            {new Date(event.date).toLocaleDateString("nb-NO", { month: "short" })}
                          </span>
                          <span className="text-lg font-bold leading-none">
                            {new Date(event.date).getDate()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(event.date)}
                          </p>
                          {event.route && (
                            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              Rute: {"title" in event.route ? event.route.title : ""}
                            </p>
                          )}
                          {event.description && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Map */}
          {selectedRoute && (
            <section>
              <div className="mb-4">
                <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase">
                  {selectedRoute.title}
                </h2>
                {selectedRoute.description && (
                  <p className="mt-1 text-muted-foreground">
                    {selectedRoute.description}
                  </p>
                )}
                {routeInfo && (
                  <div className="mt-2 flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ruler className="h-4 w-4 text-primary" />
                      <span>{routeInfo.distance}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 text-primary" />
                      <span>ca. {routeInfo.duration} kjøretid</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <CruisingMap
                  waypoints={selectedRoute.waypoints}
                  onRouteInfo={setRouteInfo}
                />
              </div>

              {selectedRoute.waypoints.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-3 text-lg font-semibold">Stoppesteder</h3>
                  <div className="space-y-2">
                    {selectedRoute.waypoints
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((wp, idx) => (
                        <div
                          key={wp.id}
                          className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                        >
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-medium">{wp.name}</p>
                            {wp.note && (
                              <p className="mt-0.5 text-sm text-muted-foreground">
                                {wp.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Route selector if multiple */}
              {data && data.routes.length > 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.routes.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => {
                        setSelectedRoute(r);
                        setRouteInfo(null);
                      }}
                      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        selectedRoute.id === r.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {r.title}
                    </button>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Past events with photos */}
          {data.past.length > 0 && (
            <section>
              <h2 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-bold uppercase">
                Tidligere <span className="text-primary">cruising</span>
              </h2>
              <div className="space-y-6">
                {data.past.map((event) => (
                  <Card key={event.id} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <h3 className="font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(event.date)}
                            {event.route && " · Rute: " + ("title" in event.route ? event.route.title : "")}
                          </p>
                        </div>
                      </div>
                      {event.description && (
                        <p className="mt-2 text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}
                      {event.photos && event.photos.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
                            <Camera className="h-4 w-4" />
                            {event.photos.length} bilder
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                            {event.photos.map((photo) => (
                              <div
                                key={photo.id}
                                className="group cursor-pointer"
                                onClick={() => setLightboxPhoto(photo)}
                              >
                                <div className="relative overflow-hidden rounded-md border border-border">
                                  <img
                                    src={photo.url}
                                    alt={photo.comment || "Cruising-bilde"}
                                    className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
                                  />
                                </div>
                                {photo.comment && (
                                  <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                    {photo.comment}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* No content fallback */}
          {data.upcoming.length === 0 && data.past.length === 0 && !selectedRoute && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MapPin className="mb-4 h-16 w-16 text-muted-foreground/50" />
              <h2 className="text-xl font-semibold">Ingen cruising planlagt</h2>
              <p className="mt-2 text-muted-foreground">
                Sjekk tilbake senere for kommende cruising!
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.comment || "Cruising-bilde"}
              className="max-h-[85vh] rounded-lg object-contain"
            />
            {lightboxPhoto.comment && (
              <div className="mt-2 rounded-md bg-black/60 px-3 py-2">
                <p className="text-sm text-white">{lightboxPhoto.comment}</p>
                <p className="text-xs text-white/60">
                  av {lightboxPhoto.uploadedBy.name}
                </p>
              </div>
            )}
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -right-2 -top-2 rounded-full bg-black/70 px-2 py-1 text-sm text-white hover:bg-black"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
