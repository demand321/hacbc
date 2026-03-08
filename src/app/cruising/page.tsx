"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

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

const CruisingMap = dynamic(() => import("./CruisingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[500px] items-center justify-center rounded-xl bg-muted">
      <div className="text-muted-foreground">Laster kart...</div>
    </div>
  ),
});

export default function CruisingPage() {
  const [route, setRoute] = useState<CruisingRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cruising")
      .then((res) => {
        if (!res.ok) throw new Error("No route");
        return res.json();
      })
      .then((data) => setRoute(data))
      .catch(() => setRoute(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold uppercase tracking-tight sm:text-5xl">
        Cruising<span className="text-hacbc-red">rute</span>
      </h1>
      <p className="mt-4 text-muted-foreground">
        Onsdags-cruising i Hamar-regionen.
      </p>

      {loading ? (
        <div className="mt-8 flex h-[500px] items-center justify-center rounded-xl bg-muted">
          <div className="text-muted-foreground">Laster...</div>
        </div>
      ) : route ? (
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase">
              {route.title}
            </h2>
            {route.description && (
              <p className="mt-2 text-muted-foreground">
                {route.description}
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <CruisingMap waypoints={route.waypoints} />
          </div>

          {route.waypoints.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-lg font-semibold">Stoppesteder</h3>
              <div className="space-y-2">
                {route.waypoints
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((wp, idx) => (
                    <div
                      key={wp.id}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-hacbc-red text-sm font-bold text-white">
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
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <MapPin className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Ingen aktiv rute</h2>
          <p className="mt-2 text-muted-foreground">
            Det er ingen aktiv cruisingrute for øyeblikket. Sjekk tilbake
            senere!
          </p>
        </div>
      )}
    </div>
  );
}
