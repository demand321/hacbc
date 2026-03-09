import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";
import { AdminGalleryUpload } from "./AdminGalleryUpload";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Galleri",
  description: "Fotoalbum fra treff, arrangementer og cruising",
};

interface GalleryItem {
  id: string;
  title: string;
  coverUrl: string | null;
  photoCount: number;
  href: string;
  date: Date;
  isCruising: boolean;
}

export default async function GalleriPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === "ADMIN";

  const [albums, cruisingEvents] = await Promise.all([
    prisma.album.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        photos: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { url: true },
        },
        _count: { select: { photos: true } },
      },
    }),
    prisma.cruisingEvent.findMany({
      where: { photos: { some: {} } },
      orderBy: { date: "desc" },
      include: {
        photos: {
          take: 1,
          orderBy: { createdAt: "asc" },
          select: { url: true },
        },
        _count: { select: { photos: true } },
      },
    }),
  ]);

  const items: GalleryItem[] = [
    ...albums.map((a) => ({
      id: a.id,
      title: a.title,
      coverUrl: a.photos[0]?.url || null,
      photoCount: a._count.photos,
      href: `/galleri/${a.id}`,
      date: a.createdAt,
      isCruising: false,
    })),
    ...cruisingEvents.map((e) => ({
      id: `cruising-${e.id}`,
      title: `Cruising: ${e.title}`,
      coverUrl: e.photos[0]?.url || null,
      photoCount: e._count.photos,
      href: `/galleri/cruising-${e.id}`,
      date: e.date,
      isCruising: true,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold uppercase tracking-tight sm:text-5xl">
        Foto<span className="text-hacbc-red">galleri</span>
      </h1>
      <p className="mt-4 text-muted-foreground">
        Bilder fra treff, arrangementer og cruising.
      </p>

      {items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <Camera className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Ingen album ennå</h2>
          <p className="mt-2 text-muted-foreground">
            Det er ingen fotoalbum for øyeblikket. Sjekk tilbake senere!
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link key={item.id} href={item.href}>
              <Card className="group h-full border-border bg-card transition-colors hover:border-hacbc-red/30">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl">
                  {item.coverUrl ? (
                    <img
                      src={item.coverUrl}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Camera className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                  {isAdmin && !item.isCruising && (
                    <AdminGalleryUpload albumId={item.id} />
                  )}
                  <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                    {item.photoCount} bilder
                  </div>
                </div>
                <CardContent className="pt-2">
                  <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold uppercase">
                    {item.title}
                  </h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
