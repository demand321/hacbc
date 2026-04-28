import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { isStoragePathUnder } from "@/lib/upload-security";
import { MAX_CAPTION_LENGTH } from "@/lib/auth-helpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "uploads";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { storagePath, caption } = body as {
    storagePath?: string;
    caption?: string;
  };

  if (!storagePath || !isStoragePathUnder(storagePath, `gallery/event-${id}`)) {
    return NextResponse.json({ error: "Ugyldig storagePath" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }
  if (session.user.memberStatus !== "APPROVED") {
    return NextResponse.json({ error: "Ikke godkjent medlem" }, { status: 403 });
  }

  const signup = await prisma.eventSignup.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
  });

  const isAdmin = session.user.role === "ADMIN";
  if (!signup && !isAdmin) {
    return NextResponse.json({ error: "Ikke tilgang" }, { status: 403 });
  }

  // Verify the file actually exists in storage
  const folder = storagePath.substring(0, storagePath.lastIndexOf("/"));
  const fileName = storagePath.substring(storagePath.lastIndexOf("/") + 1);
  const { data: list } = await supabase.storage.from(BUCKET).list(folder, {
    search: fileName,
    limit: 1,
  });
  if (!list || list.length === 0) {
    return NextResponse.json({ error: "Filen ble ikke funnet" }, { status: 404 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

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
      url: urlData.publicUrl,
      storagePath,
      caption: caption ? caption.toString().slice(0, MAX_CAPTION_LENGTH) : null,
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
