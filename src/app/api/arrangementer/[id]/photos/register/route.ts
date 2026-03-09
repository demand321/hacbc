import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { url, storagePath, caption } = await req.json();

  if (!url || !storagePath) {
    return NextResponse.json({ error: "Mangler data" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  const signup = await prisma.eventSignup.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
  });

  const isAdmin = session.user.role === "ADMIN";
  if (!signup && !isAdmin) {
    return NextResponse.json({ error: "Ikke tilgang" }, { status: 403 });
  }

  // Get or create album for this event
  let album = await prisma.album.findFirst({ where: { eventId: id } });
  if (!album) {
    const event = await prisma.event.findUnique({
      where: { id },
      select: { title: true },
    });
    album = await prisma.album.create({
      data: {
        title: event?.title || "Arrangement",
        eventId: id,
      },
    });
  }

  const photo = await prisma.photo.create({
    data: {
      url,
      storagePath,
      caption: caption || null,
      albumId: album.id,
      uploadedById: session.user.id,
    },
    include: {
      uploadedBy: { select: { name: true } },
      likes: { select: { id: true, authorName: true, userId: true } },
      comments: { orderBy: { createdAt: "asc" } },
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
