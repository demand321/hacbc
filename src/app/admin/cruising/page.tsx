"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Calendar,
  Upload,
  Image as ImageIcon,
} from "lucide-react";

const RouteEditor = dynamic(() => import("./RouteEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[450px] items-center justify-center rounded-lg bg-muted">
      <div className="text-muted-foreground">Laster kart...</div>
    </div>
  ),
});

interface WaypointData {
  id?: string;
  name: string;
  lat: number;
  lng: number;
  note: string;
}

interface RouteData {
  id?: string;
  title: string;
  description: string;
  isActive: boolean;
  waypoints: WaypointData[];
}

interface CruisingPhoto {
  id: string;
  url: string;
  comment: string | null;
  uploadedBy: { name: string };
}

interface CruisingEvent {
  id?: string;
  date: string;
  title: string;
  description: string;
  routeId: string;
  route?: { id: string; title: string } | null;
  photos: CruisingPhoto[];
}

export default function AdminCruisingPage() {
  // --- Routes state ---
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number | null>(null);

  // --- Events state ---
  const [events, setEvents] = useState<CruisingEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ date: "", title: "", description: "", routeId: "" });
  const [eventSaving, setEventSaving] = useState(false);

  // --- Tab ---
  const [tab, setTab] = useState<"events" | "routes">("events");

  // Load routes
  useEffect(() => {
    async function load() {
      const res = await fetch("/api/admin/cruising");
      if (res.ok) {
        const data = await res.json();
        setRoutes(
          data.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description ?? "",
            isActive: r.isActive,
            waypoints: r.waypoints.map((w: any) => ({
              id: w.id,
              name: w.name,
              lat: w.lat,
              lng: w.lng,
              note: w.note ?? "",
            })),
          }))
        );
        if (data.length > 0) setActiveRouteIndex(0);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Load events
  useEffect(() => {
    async function loadEvents() {
      const res = await fetch("/api/admin/cruising/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(
          data.map((e: any) => ({
            id: e.id,
            date: e.date.slice(0, 10),
            title: e.title,
            description: e.description ?? "",
            routeId: e.routeId ?? "",
            route: e.route,
            photos: e.photos ?? [],
          }))
        );
      }
      setEventsLoading(false);
    }
    loadEvents();
  }, []);

  // --- Route handlers ---
  function addRoute() {
    const newRoute: RouteData = { title: "", description: "", isActive: true, waypoints: [] };
    setRoutes((prev) => [...prev, newRoute]);
    setActiveRouteIndex(routes.length);
  }

  function updateRoute(index: number, field: string, value: string | boolean) {
    setRoutes((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function updateWaypoints(routeIndex: number, waypoints: WaypointData[]) {
    setRoutes((prev) => prev.map((r, i) => (i === routeIndex ? { ...r, waypoints } : r)));
  }

  function updateWaypoint(routeIndex: number, wpIndex: number, field: string, value: string) {
    setRoutes((prev) =>
      prev.map((r, i) =>
        i === routeIndex
          ? { ...r, waypoints: r.waypoints.map((w, wi) => (wi === wpIndex ? { ...w, [field]: value } : w)) }
          : r
      )
    );
  }

  function removeWaypoint(routeIndex: number, wpIndex: number) {
    setRoutes((prev) =>
      prev.map((r, i) =>
        i === routeIndex ? { ...r, waypoints: r.waypoints.filter((_, wi) => wi !== wpIndex) } : r
      )
    );
  }

  function moveWaypoint(routeIndex: number, wpIndex: number, direction: -1 | 1) {
    const target = wpIndex + direction;
    setRoutes((prev) =>
      prev.map((r, i) => {
        if (i !== routeIndex) return r;
        if (target < 0 || target >= r.waypoints.length) return r;
        const wps = [...r.waypoints];
        [wps[wpIndex], wps[target]] = [wps[target], wps[wpIndex]];
        return { ...r, waypoints: wps };
      })
    );
  }

  async function handleSaveRoute(routeIndex: number) {
    const route = routes[routeIndex];
    if (!route.title.trim()) {
      alert("Ruten må ha en tittel.");
      return;
    }
    setSaving(true);

    const body = {
      ...(route.id ? { id: route.id } : {}),
      title: route.title,
      description: route.description || null,
      isActive: route.isActive,
      waypoints: route.waypoints.map((w, i) => ({
        name: w.name || `Punkt ${i + 1}`,
        lat: w.lat,
        lng: w.lng,
        note: w.note || null,
        sortOrder: i,
      })),
    };

    const res = await fetch("/api/admin/cruising", {
      method: route.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const saved = await res.json();
      setRoutes((prev) =>
        prev.map((r, i) =>
          i === routeIndex
            ? {
                ...r,
                id: saved.id,
                waypoints: saved.waypoints.map((w: any) => ({
                  id: w.id,
                  name: w.name,
                  lat: w.lat,
                  lng: w.lng,
                  note: w.note ?? "",
                })),
              }
            : r
        )
      );
    } else {
      alert("Noe gikk galt. Prøv igjen.");
    }
    setSaving(false);
  }

  async function handleDeleteRoute(routeIndex: number) {
    const route = routes[routeIndex];
    if (!route.id) {
      setRoutes((prev) => prev.filter((_, i) => i !== routeIndex));
      setActiveRouteIndex(routes.length > 1 ? 0 : null);
      return;
    }
    if (!confirm("Slette denne ruten og alle veipunkter?")) return;

    await fetch("/api/admin/cruising", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: route.id }),
    });

    setRoutes((prev) => prev.filter((_, i) => i !== routeIndex));
    setActiveRouteIndex(routes.length > 1 ? 0 : null);
  }

  // --- Event handlers ---
  async function handleCreateEvent() {
    if (!newEvent.date || !newEvent.title.trim()) {
      alert("Dato og tittel er påkrevd.");
      return;
    }
    setEventSaving(true);

    const res = await fetch("/api/admin/cruising/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEvent),
    });

    if (res.ok) {
      const saved = await res.json();
      setEvents((prev) => [
        {
          id: saved.id,
          date: saved.date.slice(0, 10),
          title: saved.title,
          description: saved.description ?? "",
          routeId: saved.routeId ?? "",
          route: saved.route,
          photos: [],
        },
        ...prev,
      ]);
      setNewEvent({ date: "", title: "", description: "", routeId: "" });
      setShowNewEvent(false);
    } else {
      alert("Noe gikk galt.");
    }
    setEventSaving(false);
  }

  async function handleDeleteEvent(eventId: string) {
    if (!confirm("Slette denne cruisingen og alle bilder?")) return;
    await fetch("/api/admin/cruising/events", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: eventId }),
    });
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  async function handlePhotoUpload(eventId: string, files: FileList) {
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) continue;
      const { url, path } = await uploadRes.json();

      const comment = prompt("Kommentar til bildet (valgfritt):", "") ?? "";

      const photoRes = await fetch("/api/admin/cruising/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, url, storagePath: path, comment: comment || null }),
      });

      if (photoRes.ok) {
        const photo = await photoRes.json();
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId ? { ...e, photos: [...e.photos, photo] } : e
          )
        );
      }
    }
  }

  async function handleDeletePhoto(eventId: string, photoId: string) {
    await fetch("/api/admin/cruising/photos", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: photoId }),
    });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, photos: e.photos.filter((p) => p.id !== photoId) } : e
      )
    );
  }

  const route = activeRouteIndex !== null ? routes[activeRouteIndex] : null;

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Cruising</h2>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border">
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "events"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("events")}
        >
          <Calendar className="mr-1.5 inline h-4 w-4" />
          Cruising-turer
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "routes"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("routes")}
        >
          <ImageIcon className="mr-1.5 inline h-4 w-4" />
          Ruter
        </button>
      </div>

      {/* ============ EVENTS TAB ============ */}
      {tab === "events" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Opprett cruising-turer med dato, velg rute og legg til bilder etterpå.
            </p>
            <Button onClick={() => setShowNewEvent(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Ny cruising
            </Button>
          </div>

          {showNewEvent && (
            <Card className="border-primary/30">
              <CardContent className="space-y-3 p-4">
                <h3 className="text-sm font-medium">Ny cruising</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="evDate">Dato *</Label>
                    <Input
                      id="evDate"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="evTitle">Tittel *</Label>
                    <Input
                      id="evTitle"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="F.eks. Cruising 12. juni"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="evRoute">Rute</Label>
                  <select
                    id="evRoute"
                    value={newEvent.routeId}
                    onChange={(e) => setNewEvent({ ...newEvent, routeId: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="">Ingen rute valgt</option>
                    {routes.filter((r) => r.id).map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="evDesc">Beskrivelse</Label>
                  <Textarea
                    id="evDesc"
                    rows={2}
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Valgfri beskrivelse..."
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateEvent} disabled={eventSaving}>
                    {eventSaving ? "Lagrer..." : "Opprett"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewEvent(false)}>
                    Avbryt
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {eventsLoading ? (
            <p className="text-muted-foreground">Laster...</p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground">Ingen cruising-turer opprettet ennå.</p>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString("nb-NO", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                          {event.route && ` · Rute: ${event.route.title}`}
                        </p>
                        {event.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => event.id && handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Photos */}
                    <div className="mt-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">
                          Bilder ({event.photos.length})
                        </span>
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent">
                          <Upload className="h-3.5 w-3.5" />
                          Last opp
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && event.id) {
                                handlePhotoUpload(event.id, e.target.files);
                                e.target.value = "";
                              }
                            }}
                          />
                        </label>
                      </div>
                      {event.photos.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                          {event.photos.map((photo) => (
                            <div key={photo.id} className="group relative">
                              <img
                                src={photo.url}
                                alt={photo.comment || "Bilde"}
                                className="aspect-square w-full rounded-md border border-border object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => event.id && handleDeletePhoto(event.id, photo.id)}
                                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 className="h-3 w-3 text-white" />
                              </button>
                              {photo.comment && (
                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                  {photo.comment}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============ ROUTES TAB ============ */}
      {tab === "routes" && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Opprett og rediger ruter som kan gjenbrukes på cruising-turer.
            </p>
            <Button onClick={addRoute}>
              <Plus className="mr-2 h-4 w-4" />
              Ny rute
            </Button>
          </div>

          {loading ? (
            <p className="text-muted-foreground">Laster ruter...</p>
          ) : (
            <>
              {routes.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-2">
                  {routes.map((r, i) => (
                    <Button
                      key={i}
                      variant={activeRouteIndex === i ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveRouteIndex(i)}
                    >
                      {r.title || `Ny rute ${i + 1}`}
                    </Button>
                  ))}
                </div>
              )}

              {route && activeRouteIndex !== null && (
                <div className="space-y-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="routeTitle">Tittel *</Label>
                        <Input
                          id="routeTitle"
                          value={route.title}
                          onChange={(e) => updateRoute(activeRouteIndex, "title", e.target.value)}
                          placeholder="F.eks. Hamar - Gjøvik"
                        />
                      </div>
                      <div>
                        <Label htmlFor="routeDesc">Beskrivelse</Label>
                        <Textarea
                          id="routeDesc"
                          rows={3}
                          value={route.description}
                          onChange={(e) => updateRoute(activeRouteIndex, "description", e.target.value)}
                          placeholder="Beskrivelse av ruten..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="isActive"
                          type="checkbox"
                          checked={route.isActive}
                          onChange={(e) => updateRoute(activeRouteIndex, "isActive", e.target.checked)}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="isActive">Aktiv (vises offentlig)</Label>
                      </div>
                    </div>
                  </div>

                  <RouteEditor
                    waypoints={route.waypoints}
                    onChange={(wps) => updateWaypoints(activeRouteIndex, wps)}
                  />

                  {route.waypoints.length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                        Stoppesteder ({route.waypoints.length})
                      </h3>
                      <div className="space-y-2">
                        {route.waypoints.map((wp, wpIndex) => (
                          <Card key={wpIndex} className="border-border">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="flex flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => moveWaypoint(activeRouteIndex, wpIndex, -1)}
                                    disabled={wpIndex === 0}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveWaypoint(activeRouteIndex, wpIndex, 1)}
                                    disabled={wpIndex === route.waypoints.length - 1}
                                    className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </button>
                                </div>
                                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                                  {wpIndex + 1}
                                </div>
                                <div className="grid flex-1 gap-2 sm:grid-cols-3">
                                  <Input
                                    placeholder="Navn på stopp"
                                    value={wp.name}
                                    onChange={(e) => updateWaypoint(activeRouteIndex, wpIndex, "name", e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  <Input
                                    placeholder="Notat"
                                    value={wp.note}
                                    onChange={(e) => updateWaypoint(activeRouteIndex, wpIndex, "note", e.target.value)}
                                    className="h-8 text-sm"
                                  />
                                  <span className="flex items-center text-xs text-muted-foreground">
                                    {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeWaypoint(activeRouteIndex, wpIndex)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button onClick={() => handleSaveRoute(activeRouteIndex)} disabled={saving}>
                      {saving ? "Lagrer..." : "Lagre rute"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDeleteRoute(activeRouteIndex)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Slett rute
                    </Button>
                  </div>
                </div>
              )}

              {routes.length === 0 && (
                <p className="text-muted-foreground">
                  Ingen ruter opprettet ennå. Klikk &quot;Ny rute&quot; for å komme i gang.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
