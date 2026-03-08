import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ albumId: string }> }
) {
  const { albumId } = await params;

  try {
    const album = await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        photos: {
          orderBy: { createdAt: "asc" },
          select: { id: true, url: true, caption: true },
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
