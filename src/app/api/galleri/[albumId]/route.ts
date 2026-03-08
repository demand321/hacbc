import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ albumId: string }> }
) {
  const { albumId } = await params;

  try {
    // Cruising event photos
    if (albumId.startsWith("cruising-")) {
      const eventId = albumId.replace("cruising-", "");
      const event = await prisma.cruisingEvent.findUnique({
        where: { id: eventId },
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
      });

      if (!event) {
        return NextResponse.json({ error: "Album ikke funnet" }, { status: 404 });
      }

      return NextResponse.json({
        id: albumId,
        title: `Cruising: ${event.title}`,
        photos: event.photos.map((p) => ({
          ...p,
          caption: p.comment,
        })),
      });
    }

    // Regular album
    const album = await prisma.album.findUnique({
      where: { id: albumId },
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
    });

    if (!album) {
      return NextResponse.json(
        { error: "Album ikke funnet" },
        { status: 404 }
      );
    }

    return NextResponse.json(album);
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente album" },
      { status: 500 }
    );
  }
}
