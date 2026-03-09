import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

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
  const signupId = formData.get("signupId") as string | null;
  const caption = (formData.get("caption") as string | null)?.trim() || null;

  if (!file) {
    return NextResponse.json({ error: "Ingen fil valgt" }, { status: 400 });
  }
  const isImage = file.type.startsWith("image/");
  const isVideo = file.type.startsWith("video/");
  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "Kun bilder og video" }, { status: 400 });
  }
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: isVideo ? "Maks 100MB for video" : "Maks 10MB for bilder" },
      { status: 400 }
    );
  }

  // Verify participant (must be logged in for event photo uploads)
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
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

  // Upload to Supabase Storage
  const ext = file.name.split(".").pop() || "jpg";
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
