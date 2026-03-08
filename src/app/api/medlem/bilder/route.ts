import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const isAlbumRequest = request.nextUrl.searchParams.get("albums");

  if (isAlbumRequest) {
    const albums = await prisma.album.findMany({
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ albums });
  }

  // Return user's uploaded photos
  const photos = await prisma.photo.findMany({
    where: { uploadedById: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { album: { select: { title: true } } },
  });

  return NextResponse.json({ photos });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const body = await request.json();
  const { albumId, url, caption } = body;

  if (!albumId || !url) {
    return NextResponse.json(
      { error: "Album og bilde-URL er påkrevd" },
      { status: 400 }
    );
  }

  // Verify album exists
  const album = await prisma.album.findUnique({
    where: { id: albumId },
  });

  if (!album) {
    return NextResponse.json(
      { error: "Album ikke funnet" },
      { status: 404 }
    );
  }

  const photo = await prisma.photo.create({
    data: {
      url: url.trim(),
      storagePath: url.trim(), // Placeholder until Supabase Storage integration
      caption: caption?.trim() || null,
      albumId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
