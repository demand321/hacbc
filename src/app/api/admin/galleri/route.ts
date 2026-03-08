import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const albums = await prisma.album.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { photos: true } },
      event: { select: { id: true, title: true } },
    },
  });

  return NextResponse.json(albums);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { title, eventId } = await req.json();

  const album = await prisma.album.create({
    data: {
      title,
      eventId: eventId || null,
    },
  });

  return NextResponse.json(album);
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id } = await req.json();

  await prisma.album.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
