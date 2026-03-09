import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id, title } = await req.json();
  if (!id || !title?.trim()) {
    return NextResponse.json({ error: "Mangler id eller tittel" }, { status: 400 });
  }

  const album = await prisma.album.update({
    where: { id },
    data: { title: title.trim() },
  });

  return NextResponse.json(album);
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id } = await req.json();

  // Get all photos to clean up storage
  const photos = await prisma.photo.findMany({
    where: { albumId: id },
    select: { storagePath: true },
  });

  const storagePaths = photos
    .map((p) => p.storagePath)
    .filter((p): p is string => !!p);

  if (storagePaths.length > 0) {
    await supabase.storage.from("uploads").remove(storagePaths);
  }

  // Prisma cascade will delete photos
  await prisma.album.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
