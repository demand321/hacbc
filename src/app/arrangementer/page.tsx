import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Users } from "lucide-react";

export const dynamic = "force-dynamic";

type EventItem = {
  id: string;
  title: string;
  date: Date;
  location: string | null;
  imageUrl: string | null;
  eventType: string;
  isClubEvent: boolean;
  kind: "event";
} | {
  id: string;
  title: string;
  date: Date;
  routeTitle: string | null;
  signupCount: number;
  photoCount: number;
  kind: "cruising";
};

export const metadata = {
  title: "Eventer",
  description: "Kommende og tidligere eventer",
};

function DateBadge({ date, eventType }: { date: Date; eventType: string }) {
  const day = date.getDate();
  const month = date.toLocaleDateString("nb-NO", { month: "short" });

  const bgClass =
    eventType === "AMCAR" ? "bg-blue-600" :
    eventType === "VETERAN" ? "bg-amber-600" :
    eventType === "CRUISING" ? "bg-primary" :
    "bg-hacbc-red";

  return (
    <div className={`flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-full text-white ${bgClass}`}>
      <span className="text-lg font-bold leading-none">{day}</span>
      <span className="text-[10px] uppercase leading-none">{month}</span>
    </div>
  );
}

function EventCard({ event, isPast }: { event: EventItem; isPast?: boolean }) {
  if (event.kind === "cruising") {
    return (
      <Link href={`/cruising/${event.id}`}>
        <Card className={`group h-full border-border bg-card transition-colors hover:border-primary/30 border-l-[5px] border-l-primary shadow-[inset_0_0_12px_-4px] shadow-primary/20 ${isPast ? "opacity-75 hover:opacity-100" : ""}`}>
          <CardContent className="flex items-start gap-4 pt-2">
            <DateBadge date={event.date} eventType="CRUISING" />
            <div className="min-w-0 flex-1">
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold uppercase leading-tight">
                {event.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {event.date.toLocaleDateString("nb-NO", {
                  weekday: isPast ? undefined : "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              {event.routeTitle && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3 text-primary" />
                  {event.routeTitle}
                </p>
              )}
              {event.signupCount > 0 && (
                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {event.signupCount} påmeldt
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  const isClub = event.isClubEvent || event.eventType === "CRUISING";

  return (
    <Link href={`/arrangementer/${event.id}`}>
      <Card className={`group h-full border-border bg-card transition-colors hover:border-hacbc-red/30 ${isPast ? "opacity-75 hover:opacity-100" : ""} ${isClub ? "border-l-[5px] border-l-hacbc-red shadow-[inset_0_0_12px_-4px] shadow-hacbc-red/20" : ""}`}>
        {event.imageUrl && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-xl">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <CardContent className="flex items-start gap-4 pt-2">
          <DateBadge date={event.date} eventType={event.eventType} />
          <div className="min-w-0 flex-1">
            <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold uppercase leading-tight">
              {event.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {event.date.toLocaleDateString("nb-NO", {
                weekday: isPast ? undefined : "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {event.location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 text-hacbc-red" />
                {event.location}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function EventerPage() {
  const now = new Date();

  const [events, cruisingEvents] = await Promise.all([
    prisma.event.findMany({
      where: { isPublished: true },
      orderBy: { date: "asc" },
    }),
    prisma.cruisingEvent.findMany({
      orderBy: { date: "asc" },
      include: {
        route: { select: { title: true } },
        signups: { select: { id: true } },
        photos: { select: { id: true } },
      },
    }),
  ]);

  const allEvents: EventItem[] = [
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      location: e.location,
      imageUrl: e.imageUrl,
      eventType: e.eventType,
      isClubEvent: e.isClubEvent,
      kind: "event" as const,
    })),
    ...cruisingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date,
      routeTitle: e.route?.title ?? null,
      signupCount: e.signups.length,
      photoCount: e.photos.length,
      kind: "cruising" as const,
    })),
  ];

  const upcoming = allEvents
    .filter((e) => e.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const past = allEvents
    .filter((e) => e.date < now)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold uppercase tracking-tight sm:text-5xl">
        Even<span className="text-hacbc-red">ter</span>
      </h1>
      <p className="mt-4 text-muted-foreground">
        Treff, cruising, klubbkvelder og sosiale samlinger.
      </p>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-1 rounded-full bg-hacbc-red" />
          Klubbarrangement
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full bg-primary" />
          Cruising
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full bg-blue-600" />
          Am-car
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full bg-amber-600" />
          Veteran
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block h-4 w-4 rounded-full bg-hacbc-red" />
          Annet
        </span>
      </div>

      {/* Upcoming */}
      <section className="mt-10">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-tight">
          Kommende eventer
        </h2>
        {upcoming.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Ingen kommende eventer for øyeblikket.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={`${event.kind}-${event.id}`} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="mt-16">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-tight text-muted-foreground">
            Tidligere eventer
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={`${event.kind}-${event.id}`} event={event} isPast />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
