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

  const comments = await prisma.photoComment.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const body = await req.json();
  const session = await getServerSession(authOptions);

  const content = (body.content || "").trim();
  const authorName = session?.user?.name || (body.authorName || "").trim();
  const type = body.type || "cruising";

  if (!content) {
    return NextResponse.json({ error: "Kommentar er påkrevd" }, { status: 400 });
  }
  if (!authorName) {
    return NextResponse.json({ error: "Navn er påkrevd" }, { status: 400 });
  }

  const comment = await prisma.photoComment.create({
    data: {
      content,
      authorName,
      userId: session?.user?.id || null,
      ...(type === "gallery"
        ? { galleryPhotoId: photoId }
        : { cruisingPhotoId: photoId }),
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
