import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

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

    // Only return signup IDs to the owning user (logged-in matching userId).
    // Guests rely on localStorage to remember their own signupId from the POST response.
    const currentUserId = session?.user?.id ?? null;
    const sanitized = {
      ...event,
      signups: event.signups.map((s) => ({
        id: currentUserId && s.userId === currentUserId ? s.id : null,
        name: s.name,
        userId: s.userId,
        createdAt: s.createdAt,
      })),
    };

    return NextResponse.json(sanitized);
  } catch (err) {
    console.error("Cruising detail error:", err);
    return NextResponse.json({ error: "Serverfeil" }, { status: 500 });
  }
}
