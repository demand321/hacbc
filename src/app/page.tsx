import { prisma } from "@/lib/prisma";
import ThemedHome from "./ThemedHome";

export const dynamic = "force-dynamic";

export default async function Home() {
  const nextEvent = await prisma.event.findFirst({
    where: { isPublished: true, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });

  const serializedEvent = nextEvent
    ? {
        id: nextEvent.id,
        title: nextEvent.title,
        date: nextEvent.date.toISOString(),
        location: nextEvent.location,
      }
    : null;

  return <ThemedHome nextEvent={serializedEvent} />;
}
