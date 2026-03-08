"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

interface Waypoint {
  id?: string;
  name: string;
  lat: string;
  lng: string;
  note: string;
}

interface RouteData {
  id?: string;
  title: string;
  description: string;
  isActive: boolean;
  waypoints: Waypoint[];
}

const emptyWaypoint = (): Waypoint => ({
  name: "",
  lat: "",
  lng: "",
  note: "",
});

export default function AdminCruisingPage() {
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number | null>(null);

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
              lat: String(w.lat),
              lng: String(w.lng),
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

  function addRoute() {
    const newRoute: RouteData = {
      title: "",
      description: "",
      isActive: true,
      waypoints: [emptyWaypoint()],
    };
    setRoutes((prev) => [...prev, newRoute]);
    setActiveRouteIndex(routes.length);
  }

  function updateRoute(index: number, field: string, value: string | boolean) {
    setRoutes((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function addWaypoint(routeIndex: number) {
    setRoutes((prev) =>
      prev.map((r, i) =>
        i === routeIndex
          ? { ...r, waypoints: [...r.waypoints, emptyWaypoint()] }
          : r
      )
    );
  }

  function removeWaypoint(routeIndex: number, wpIndex: number) {
    setRoutes((prev) =>
      prev.map((r, i) =>
        i === routeIndex
          ? { ...r, waypoints: r.waypoints.filter((_, wi) => wi !== wpIndex) }
          : r
      )
    );
  }

  function updateWaypoint(
    routeIndex: number,
    wpIndex: number,
    field: string,
    value: string
  ) {
    setRoutes((prev) =>
      prev.map((r, i) =>
        i === routeIndex
          ? {
              ...r,
              waypoints: r.waypoints.map((w, wi) =>
                wi === wpIndex ? { ...w, [field]: value } : w
              ),
            }
          : r
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

  async function handleSave(routeIndex: number) {
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
        name: w.name,
        lat: parseFloat(w.lat),
        lng: parseFloat(w.lng),
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
                  lat: String(w.lat),
                  lng: String(w.lng),
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

  async function handleDelete(routeIndex: number) {
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

  if (loading) {
    return <p className="text-muted-foreground">Laster ruter...</p>;
  }

  const route = activeRouteIndex !== null ? routes[activeRouteIndex] : null;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Cruising-ruter</h2>
        <Button onClick={addRoute} className="bg-hacbc-red hover:bg-hacbc-red/80">
          <Plus className="mr-2 h-4 w-4" />
          Ny rute
        </Button>
      </div>

      {/* Route selector */}
      {routes.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {routes.map((r, i) => (
            <Button
              key={i}
              variant={activeRouteIndex === i ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveRouteIndex(i)}
              className={activeRouteIndex === i ? "bg-hacbc-red hover:bg-hacbc-red/80" : ""}
            >
              {r.title || `Ny rute ${i + 1}`}
            </Button>
          ))}
        </div>
      )}

      {route && activeRouteIndex !== null && (
        <div className="max-w-3xl space-y-6">
          {/* Route details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="routeTitle">Tittel *</Label>
              <Input
                id="routeTitle"
                value={route.title}
                onChange={(e) => updateRoute(activeRouteIndex, "title", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="routeDesc">Beskrivelse</Label>
              <Textarea
                id="routeDesc"
                rows={3}
                value={route.description}
                onChange={(e) =>
                  updateRoute(activeRouteIndex, "description", e.target.value)
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={route.isActive}
                onChange={(e) =>
                  updateRoute(activeRouteIndex, "isActive", e.target.checked)
                }
                className="h-4 w-4 accent-hacbc-red"
              />
              <Label htmlFor="isActive">Aktiv</Label>
            </div>
          </div>

          {/* Waypoints */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">
                Veipunkter ({route.waypoints.length})
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => addWaypoint(activeRouteIndex)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Legg til
              </Button>
            </div>

            <div className="space-y-3">
              {route.waypoints.map((wp, wpIndex) => (
                <Card key={wpIndex} className="border-border">
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex flex-col gap-1 pt-1">
                        <button
                          type="button"
                          onClick={() => moveWaypoint(activeRouteIndex, wpIndex, -1)}
                          disabled={wpIndex === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={() => moveWaypoint(activeRouteIndex, wpIndex, 1)}
                          disabled={wpIndex === route.waypoints.length - 1}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="grid gap-2 sm:grid-cols-3">
                          <Input
                            placeholder="Navn"
                            value={wp.name}
                            onChange={(e) =>
                              updateWaypoint(activeRouteIndex, wpIndex, "name", e.target.value)
                            }
                          />
                          <Input
                            placeholder="Breddegrad (lat)"
                            type="number"
                            step="any"
                            value={wp.lat}
                            onChange={(e) =>
                              updateWaypoint(activeRouteIndex, wpIndex, "lat", e.target.value)
                            }
                          />
                          <Input
                            placeholder="Lengdegrad (lng)"
                            type="number"
                            step="any"
                            value={wp.lng}
                            onChange={(e) =>
                              updateWaypoint(activeRouteIndex, wpIndex, "lng", e.target.value)
                            }
                          />
                        </div>
                        <Input
                          placeholder="Notat (valgfritt)"
                          value={wp.note}
                          onChange={(e) =>
                            updateWaypoint(activeRouteIndex, wpIndex, "note", e.target.value)
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeWaypoint(activeRouteIndex, wpIndex)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => handleSave(activeRouteIndex)}
              disabled={saving}
              className="bg-hacbc-red hover:bg-hacbc-red/80"
            >
              {saving ? "Lagrer..." : "Lagre rute"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDelete(activeRouteIndex)}
              className="text-red-400 hover:text-red-300"
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
    </div>
  );
}
