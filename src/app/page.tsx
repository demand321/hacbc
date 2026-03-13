import { prisma } from "@/lib/prisma";
import ThemedHome from "./ThemedHome";

export const dynamic = "force-dynamic";

export default async function Home() {
  const now = new Date();

  const [events, cruisingEvents] = await Promise.all([
    prisma.event.findMany({
      where: { isPublished: true, date: { gte: now } },
      orderBy: { date: "asc" },
      take: 4,
      select: { id: true, title: true, date: true, location: true },
    }),
    prisma.cruisingEvent.findMany({
      where: { date: { gte: now } },
      orderBy: { date: "asc" },
      take: 4,
      select: { id: true, title: true, date: true },
    }),
  ]);

  const upcoming = [
    ...events.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString(),
      location: e.location,
      type: "event" as const,
    })),
    ...cruisingEvents.map((e) => ({
      id: e.id,
      title: e.title,
      date: e.date.toISOString(),
      location: null,
      type: "cruising" as const,
    })),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return <ThemedHome upcomingEvents={upcoming} />;
}
