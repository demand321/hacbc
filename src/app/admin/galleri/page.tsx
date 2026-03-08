import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { AlbumActions } from "./AlbumActions";

export default async function AdminGalleryPage() {
  const [albums, events] = await Promise.all([
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
  ]);

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Galleri</h2>
      <AlbumActions
        albums={albums.map((a) => ({
          id: a.id,
          title: a.title,
          photoCount: a._count.photos,
          eventTitle: a.event?.title ?? null,
          createdAt: a.createdAt.toISOString(),
        }))}
        events={events}
      />
    </div>
  );
}
