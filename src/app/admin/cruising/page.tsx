"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";

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

  function addRoute() {
    const newRoute: RouteData = {
      title: "",
      description: "",
      isActive: true,
      waypoints: [],
    };
    setRoutes((prev) => [...prev, newRoute]);
    setActiveRouteIndex(routes.length);
  }

  function updateRoute(index: number, field: string, value: string | boolean) {
    setRoutes((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function updateWaypoints(routeIndex: number, waypoints: WaypointData[]) {
    setRoutes((prev) =>
      prev.map((r, i) => (i === routeIndex ? { ...r, waypoints } : r))
    );
  }

  function updateWaypoint(routeIndex: number, wpIndex: number, field: string, value: string) {
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

  function removeWaypoint(routeIndex: number, wpIndex: number) {
    setRoutes((prev) =>
      prev.map((r, i) =>
        i === routeIndex
          ? { ...r, waypoints: r.waypoints.filter((_, wi) => wi !== wpIndex) }
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
        <Button onClick={addRoute}>
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
            >
              {r.title || `Ny rute ${i + 1}`}
            </Button>
          ))}
        </div>
      )}

      {route && activeRouteIndex !== null && (
        <div className="space-y-6">
          {/* Route details */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="routeTitle">Tittel *</Label>
                <Input
                  id="routeTitle"
                  value={route.title}
                  onChange={(e) =>
                    updateRoute(activeRouteIndex, "title", e.target.value)
                  }
                  placeholder="F.eks. Onsdags-cruising Hamar"
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
                  placeholder="Beskrivelse av ruten..."
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
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive">Aktiv (vises offentlig)</Label>
              </div>
            </div>
          </div>

          {/* Map editor */}
          <RouteEditor
            waypoints={route.waypoints}
            onChange={(wps) => updateWaypoints(activeRouteIndex, wps)}
          />

          {/* Waypoint list */}
          {route.waypoints.length > 0 && (
            <div>
              <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                Stoppesteder ({route.waypoints.length}) - gi dem navn og
                notater
              </h3>
              <div className="space-y-2">
                {route.waypoints.map((wp, wpIndex) => (
                  <Card key={wpIndex} className="border-border">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              moveWaypoint(activeRouteIndex, wpIndex, -1)
                            }
                            disabled={wpIndex === 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              moveWaypoint(activeRouteIndex, wpIndex, 1)
                            }
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
                            onChange={(e) =>
                              updateWaypoint(
                                activeRouteIndex,
                                wpIndex,
                                "name",
                                e.target.value
                              )
                            }
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder="Notat"
                            value={wp.note}
                            onChange={(e) =>
                              updateWaypoint(
                                activeRouteIndex,
                                wpIndex,
                                "note",
                                e.target.value
                              )
                            }
                            className="h-8 text-sm"
                          />
                          <span className="flex items-center text-xs text-muted-foreground">
                            {wp.lat.toFixed(4)}, {wp.lng.toFixed(4)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeWaypoint(activeRouteIndex, wpIndex)
                          }
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={() => handleSave(activeRouteIndex)}
              disabled={saving}
            >
              {saving ? "Lagrer..." : "Lagre rute"}
            </Button>
            <Button
              variant="outline"
              onClick={() => handleDelete(activeRouteIndex)}
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
          Ingen ruter opprettet ennå. Klikk &quot;Ny rute&quot; for å komme i
          gang.
        </p>
      )}
    </div>
  );
}
