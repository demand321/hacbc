import { prisma } from "@/lib/prisma";
import { AlbumActions } from "./AlbumActions";

export const dynamic = "force-dynamic";

export default async function AdminGalleryPage() {
  const [albums, events, cruisingEvents] = await Promise.all([
    prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { photos: true } },
        event: { select: { id: true, title: true } },
      },
    }),
    prisma.event.findMany({
      orderBy: { date: "desc" },
      select: { id: true, title: true },
    }),
    prisma.cruisingEvent.findMany({
      where: { photos: { some: {} } },
      orderBy: { date: "desc" },
      include: {
        _count: { select: { photos: true } },
      },
    }),
  ]);

  const allAlbums = [
    ...albums.map((a) => ({
      id: a.id,
      title: a.title,
      photoCount: a._count.photos,
      eventTitle: a.event?.title ?? null,
      createdAt: a.createdAt.toISOString(),
      type: "gallery" as const,
    })),
    ...cruisingEvents.map((e) => ({
      id: `cruising-${e.id}`,
      title: `Cruising: ${e.title}`,
      photoCount: e._count.photos,
      eventTitle: null,
      createdAt: e.date.toISOString(),
      type: "cruising" as const,
    })),
  ];

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Galleri</h2>
      <AlbumActions
        albums={allAlbums}
        events={events}
      />
    </div>
  );
}
