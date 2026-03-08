import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const event = await prisma.cruisingEvent.findUnique({
      where: { id },
      include: {
        route: {
          include: { waypoints: { orderBy: { sortOrder: "asc" } } },
        },
        signups: {
          orderBy: { createdAt: "asc" },
          select: { id: true, name: true, userId: true, createdAt: true },
        },
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
      return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (err) {
    console.error("Cruising detail error:", err);
    return NextResponse.json({ error: "Serverfeil", detail: String(err) }, { status: 500 });
  }
}
