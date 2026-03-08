import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const type = req.nextUrl.searchParams.get("type") || "cruising";

  const where =
    type === "gallery"
      ? { galleryPhotoId: photoId }
      : { cruisingPhotoId: photoId };

  const likes = await prisma.photoLike.findMany({
    where,
    select: { id: true, authorName: true, userId: true },
  });

  return NextResponse.json(likes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const body = await req.json();
  const session = await getServerSession(authOptions);

  const authorName = session?.user?.name || (body.authorName || "").trim();
  const type = body.type || "cruising";

  if (!authorName) {
    return NextResponse.json({ error: "Navn er påkrevd" }, { status: 400 });
  }

  // Check for existing like (logged-in users only to prevent duplicates)
  if (session?.user?.id) {
    const existing = await prisma.photoLike.findFirst({
      where: {
        userId: session.user.id,
        ...(type === "gallery"
          ? { galleryPhotoId: photoId }
          : { cruisingPhotoId: photoId }),
      },
    });
    if (existing) {
      // Unlike - toggle
      await prisma.photoLike.delete({ where: { id: existing.id } });
      return NextResponse.json({ unliked: true });
    }
  }

  const like = await prisma.photoLike.create({
    data: {
      authorName,
      userId: session?.user?.id || null,
      ...(type === "gallery"
        ? { galleryPhotoId: photoId }
        : { cruisingPhotoId: photoId }),
    },
  });

  return NextResponse.json(like, { status: 201 });
}
