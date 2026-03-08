import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, MapPin, Clock, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id, isPublished: true },
  });
  if (!event) return { title: "Arrangement ikke funnet" };
  return { title: event.title };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id, isPublished: true },
    include: {
      albums: {
        select: { id: true, title: true, _count: { select: { photos: true } } },
      },
    },
  });

  if (!event) notFound();

  const dateStr = event.date.toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const timeStr = event.date.toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endDateStr = event.endDate
    ? event.endDate.toLocaleDateString("nb-NO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const endTimeStr = event.endDate
    ? event.endDate.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Button variant="ghost" className="mb-6" asChild><Link href="/arrangementer">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tilbake til arrangementer
      </Link></Button>

      {event.imageUrl && (
        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-xl">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="mt-8">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          {event.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-hacbc-red" />
            <span>
              {dateStr} kl. {timeStr}
              {endDateStr && endTimeStr && (
                <>
                  {" "}
                  &ndash; {endDateStr} kl. {endTimeStr}
                </>
              )}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-hacbc-red" />
              <span>{event.location}</span>
              {event.address && (
                <span className="text-muted-foreground/70">
                  ({event.address})
                </span>
              )}
            </div>
          )}
        </div>

        {event.description && (
          <div className="mt-8">
            <p className="whitespace-pre-line text-muted-foreground">
              {event.description}
            </p>
          </div>
        )}

        {/* Photo albums */}
        {event.albums.length > 0 && (
          <div className="mt-10">
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
              Fotoalbum
            </h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {event.albums.map((album: { id: string; title: string; _count: { photos: number } }) => (
                <Button key={album.id} variant="outline" asChild><Link href={`/galleri/${album.id}`}>
                  <Camera className="mr-2 h-4 w-4" />
                  {album.title} ({album._count.photos} bilder)
                </Link></Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
