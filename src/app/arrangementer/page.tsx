import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Calendar } from "lucide-react";

type EventItem = {
  id: string;
  title: string;
  date: Date;
  location: string | null;
  imageUrl: string | null;
};

export const metadata = {
  title: "Arrangementer",
  description: "Kommende og tidligere arrangementer",
};

function DateBadge({ date }: { date: Date }) {
  const day = date.getDate();
  const month = date.toLocaleDateString("nb-NO", { month: "short" });
  return (
    <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-full bg-hacbc-red text-white">
      <span className="text-lg font-bold leading-none">{day}</span>
      <span className="text-[10px] uppercase leading-none">{month}</span>
    </div>
  );
}

export default async function ArrangementerPage() {
  const now = new Date();

  const events = await prisma.event.findMany({
    where: { isPublished: true },
    orderBy: { date: "asc" },
  });

  const upcoming = events.filter((e: { date: Date }) => e.date >= now);
  const past = events
    .filter((e: { date: Date }) => e.date < now)
    .sort((a: { date: Date }, b: { date: Date }) => b.date.getTime() - a.date.getTime());

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
            {upcoming.map((event: EventItem) => (
              <Link key={event.id} href={`/arrangementer/${event.id}`}>
                <Card className="group h-full border-border bg-card transition-colors hover:border-hacbc-red/30">
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
                    <DateBadge date={event.date} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold uppercase leading-tight">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.date.toLocaleDateString("nb-NO", {
                          weekday: "long",
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
            {past.map((event: EventItem) => (
              <Link key={event.id} href={`/arrangementer/${event.id}`}>
                <Card className="group h-full border-border bg-card opacity-75 transition-colors hover:border-hacbc-red/30 hover:opacity-100">
                  <CardContent className="flex items-start gap-4 pt-2">
                    <DateBadge date={event.date} />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold uppercase leading-tight">
                        {event.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {event.date.toLocaleDateString("nb-NO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {event.location && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {event.location}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
