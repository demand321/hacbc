import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";

export const metadata = {
  title: "Galleri",
  description: "Fotoalbum fra treff og arrangementer",
};

export default async function GalleriPage() {
  const albums = await prisma.album.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      photos: {
        take: 1,
        orderBy: { createdAt: "asc" },
        select: { url: true },
      },
      _count: { select: { photos: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold uppercase tracking-tight sm:text-5xl">
        Foto<span className="text-hacbc-red">galleri</span>
      </h1>
      <p className="mt-4 text-muted-foreground">
        Bilder fra treff og arrangementer.
      </p>

      {albums.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <Camera className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Ingen album ennå</h2>
          <p className="mt-2 text-muted-foreground">
            Det er ingen fotoalbum for øyeblikket. Sjekk tilbake senere!
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album: { id: string; title: string; photos: { url: string }[]; _count: { photos: number } }) => {
            const coverUrl = album.photos[0]?.url;
            return (
              <Link key={album.id} href={`/galleri/${album.id}`}>
                <Card className="group h-full border-border bg-card transition-colors hover:border-hacbc-red/30">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl">
                    {coverUrl ? (
                      <img
                        src={coverUrl}
                        alt={album.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-muted">
                        <Camera className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white">
                      {album._count.photos} bilder
                    </div>
                  </div>
                  <CardContent className="pt-2">
                    <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold uppercase">
                      {album.title}
                    </h3>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
