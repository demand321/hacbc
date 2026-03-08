"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Calendar, Users, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface CruisingEvent {
  id: string;
  date: string;
  title: string;
  description: string | null;
  route: { title: string } | null;
  signups: { id: string }[];
  photos?: { id: string }[];
}

interface CruisingData {
  upcoming: CruisingEvent[];
  past: CruisingEvent[];
}

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

  useEffect(() => {
    fetch("/api/cruising")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold uppercase tracking-tight sm:text-5xl">
        <span className="text-primary">Cruising</span>
      </h1>
      <p className="mt-4 text-muted-foreground">
        Cruising i Hamar-regionen. Se kommende turer og meld deg på!
      </p>

      {loading ? (
        <div className="mt-16 flex items-center justify-center">
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
                  <Link key={event.id} href={`/cruising/${event.id}`}>
                    <Card className="h-full cursor-pointer border-border transition-colors hover:border-primary/50">
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
                          <div className="min-w-0">
                            <h3 className="font-semibold">{event.title}</h3>
                            <p className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {formatDate(event.date)}
                            </p>
                            {event.route && (
                              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {event.route.title}
                              </p>
                            )}
                            {event.signups.length > 0 && (
                              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {event.signups.length} påmeldt
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Past events */}
          {data.past.length > 0 && (
            <section>
              <h2 className="mb-4 font-[family-name:var(--font-heading)] text-2xl font-bold uppercase">
                Tidligere <span className="text-primary">cruising</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.past.map((event) => (
                  <Link key={event.id} href={`/cruising/${event.id}`}>
                    <Card className="h-full cursor-pointer border-border transition-colors hover:border-primary/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <span className="text-xs font-bold uppercase leading-none">
                              {new Date(event.date).toLocaleDateString("nb-NO", { month: "short" })}
                            </span>
                            <span className="text-lg font-bold leading-none">
                              {new Date(event.date).getDate()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold">{event.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(event.date)}
                              {event.route && ` · ${event.route.title}`}
                            </p>
                            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                              {event.signups.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {event.signups.length}
                                </span>
                              )}
                              {event.photos && event.photos.length > 0 && (
                                <span className="flex items-center gap-1">
                                  <Camera className="h-3 w-3" />
                                  {event.photos.length} bilder
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* No content fallback */}
          {data.upcoming.length === 0 && data.past.length === 0 && (
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
    </div>
  );
}
