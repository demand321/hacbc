import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar, Car, Wrench, Star } from "lucide-react";

export const dynamic = "force-dynamic";

type EventItem = {
  id: string;
  title: string;
  date: Date;
  location: string | null;
  imageUrl: string | null;
  eventType: string;
  isClubEvent: boolean;
};

export const metadata = {
  title: "Arrangementer",
  description: "Kommende og tidligere arrangementer",
};

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Car }> = {
  AMCAR: {
    label: "Am-car",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    icon: Car,
  },
  VETERAN: {
    label: "Veteran",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    icon: Wrench,
  },
  GENERAL: {
    label: "Arrangement",
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/10",
    borderColor: "border-zinc-500/30",
    icon: Calendar,
  },
};

function DateBadge({ date, eventType }: { date: Date; eventType: string }) {
  const day = date.getDate();
  const month = date.toLocaleDateString("nb-NO", { month: "short" });
  const config = EVENT_TYPE_CONFIG[eventType] || EVENT_TYPE_CONFIG.GENERAL;

  const bgClass =
    eventType === "AMCAR" ? "bg-blue-600" :
    eventType === "VETERAN" ? "bg-amber-600" :
    "bg-hacbc-red";

  return (
    <div className={`flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-full text-white ${bgClass}`}>
      <span className="text-lg font-bold leading-none">{day}</span>
      <span className="text-[10px] uppercase leading-none">{month}</span>
    </div>
  );
}

function EventTypeBadge({ eventType }: { eventType: string }) {
  const config = EVENT_TYPE_CONFIG[eventType] || EVENT_TYPE_CONFIG.GENERAL;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.color} ${config.bgColor} ${config.borderColor}`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

function ClubBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-hacbc-red/30 bg-hacbc-red/10 px-2 py-0.5 text-[11px] font-medium text-hacbc-red">
      <Star className="h-3 w-3 fill-hacbc-red" />
      HACBC
    </span>
  );
}

function EventCard({ event, isPast }: { event: EventItem; isPast?: boolean }) {
  const config = EVENT_TYPE_CONFIG[event.eventType] || EVENT_TYPE_CONFIG.GENERAL;

  return (
    <Link href={`/arrangementer/${event.id}`}>
      <Card className={`group h-full border-border bg-card transition-colors hover:border-hacbc-red/30 ${isPast ? "opacity-75 hover:opacity-100" : ""} ${event.isClubEvent ? "ring-1 ring-hacbc-red/20" : ""}`}>
        {event.imageUrl && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-xl">
            <img
              src={event.imageUrl}
              alt={event.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute left-2 top-2 flex gap-1.5">
              <EventTypeBadge eventType={event.eventType} />
              {event.isClubEvent && <ClubBadge />}
            </div>
          </div>
        )}
        <CardContent className="flex items-start gap-4 pt-2">
          <DateBadge date={event.date} eventType={event.eventType} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold uppercase leading-tight">
                {event.title}
              </h3>
            </div>
            {!event.imageUrl && (
              <div className="mt-1 flex gap-1.5">
                <EventTypeBadge eventType={event.eventType} />
                {event.isClubEvent && <ClubBadge />}
              </div>
            )}
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

export default async function ArrangementerPage() {
  const now = new Date();

  const events = await prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { date: "asc" },
  });

  const upcoming = events.filter((e) => e.date >= now);
  const past = events
    .filter((e) => e.date < now)
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold uppercase tracking-tight sm:text-5xl">
        Arrange<span className="text-hacbc-red">menter</span>
      </h1>
      <p className="mt-4 text-muted-foreground">
        Treff, cruising og klubbkvelder.
      </p>

      {/* Upcoming */}
      <section className="mt-10">
        <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-tight">
          Kommende arrangementer
        </h2>
        {upcoming.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Ingen kommende arrangementer for øyeblikket.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section className="mt-16">
          <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-tight text-muted-foreground">
            Tidligere arrangementer
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <EventCard key={event.id} event={event} isPast />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
