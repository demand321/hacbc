import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApproved, MAX_CAPTION_LENGTH } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const session = await requireApproved();
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
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { albumId, url, caption } = body as {
    albumId?: string;
    url?: string;
    caption?: string;
  };

  if (!albumId || !url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Album og bilde-URL er påkrevd" },
      { status: 400 }
    );
  }

  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!supabaseHost || !url.startsWith(`${supabaseHost}/storage/v1/object/public/uploads/`)) {
    return NextResponse.json(
      { error: "URL må peke til klubbens lagring" },
      { status: 400 }
    );
  }

  const album = await prisma.album.findUnique({ where: { id: albumId } });
  if (!album) {
    return NextResponse.json({ error: "Album ikke funnet" }, { status: 404 });
  }

  const storagePath = decodeURIComponent(
    url.substring(`${supabaseHost}/storage/v1/object/public/uploads/`.length)
  );

  const photo = await prisma.photo.create({
    data: {
      url: url.trim(),
      storagePath,
      caption: caption ? caption.toString().trim().slice(0, MAX_CAPTION_LENGTH) : null,
      albumId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
