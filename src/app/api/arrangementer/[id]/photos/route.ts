import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { requireApproved, MAX_CAPTION_LENGTH } from "@/lib/auth-helpers";
import { isMimeAllowed, extFromMime, ALLOWED_VIDEO_TYPES } from "@/lib/upload-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "uploads";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const caption = ((formData.get("caption") as string | null)?.trim() || "").slice(0, MAX_CAPTION_LENGTH) || null;

  if (!file) {
    return NextResponse.json({ error: "Ingen fil valgt" }, { status: 400 });
  }
  if (!isMimeAllowed(file.type, "imageOrVideo")) {
    return NextResponse.json({ error: "Filtypen er ikke tillatt" }, { status: 400 });
  }
  const isVideo = ALLOWED_VIDEO_TYPES.has(file.type.toLowerCase());
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isVideo ? "Maks 100MB for video" : "Maks 10MB for bilder" },
      { status: 400 }
    );
  }

  // Verify participant (must be approved member for event photo uploads)
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json(
      { error: "Du må være innlogget for å laste opp bilder" },
      { status: 401 }
    );
  }

  const signup = await prisma.eventSignup.findUnique({
    where: { eventId_userId: { eventId: id, userId: session.user.id } },
  });

  // Allow admin or signed-up participants
  const isAdmin = session.user.role === "ADMIN";
  if (!signup && !isAdmin) {
    return NextResponse.json(
      { error: "Du må være påmeldt for å laste opp bilder" },
      { status: 403 }
    );
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

  // Upload to Supabase Storage — extension from validated MIME
  const ext = extFromMime(file.type);
  const fileName = `gallery/${album.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ error: "Opplasting feilet" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  const photo = await prisma.photo.create({
    data: {
      url: urlData.publicUrl,
      storagePath: fileName,
      caption,
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
