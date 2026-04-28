import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAX_COMMENT_LENGTH } from "@/lib/auth-helpers";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

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
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du må være innlogget for å kommentere" },
      { status: 401 }
    );
  }
  if (session.user.memberStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "Bare godkjente medlemmer kan kommentere" },
      { status: 403 }
    );
  }

  // 20 comments per user per 10 min
  const rl = rateLimit(`comment:${session.user.id}`, 20, 10 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl);

  const body = await req.json().catch(() => ({}));
  const content = String(body.content || "").trim().slice(0, MAX_COMMENT_LENGTH);
  const type = body.type === "gallery" ? "gallery" : "cruising";

  if (!content) {
    return NextResponse.json({ error: "Kommentar er påkrevd" }, { status: 400 });
  }

  const authorName = session.user.name || "Medlem";

  const comment = await prisma.photoComment.create({
    data: {
      content,
      authorName,
      userId: session.user.id,
      ...(type === "gallery"
        ? { galleryPhotoId: photoId }
        : { cruisingPhotoId: photoId }),
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
