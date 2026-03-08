import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id, isPublished: true },
    include: {
      route: {
        include: { waypoints: { orderBy: { sortOrder: "asc" } } },
      },
      signups: {
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true, userId: true, createdAt: true },
      },
      albums: {
        include: {
          photos: {
            orderBy: { createdAt: "asc" },
            include: {
              uploadedBy: { select: { name: true } },
              likes: { select: { id: true, authorName: true, userId: true } },
              comments: { orderBy: { createdAt: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }

  // Flatten photos from all albums
  const photos = event.albums.flatMap((album) =>
    album.photos.map((p) => ({
      ...p,
      albumTitle: album.title,
    }))
  );

  return NextResponse.json({
    ...event,
    photos,
  });
}
