import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { isMimeAllowed, extFromMime, ALLOWED_VIDEO_TYPES } from "@/lib/upload-security";
import { MAX_CAPTION_LENGTH } from "@/lib/auth-helpers";

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
  const comment = ((formData.get("comment") as string | null)?.trim() || "").slice(0, MAX_CAPTION_LENGTH) || null;

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

  // Verify participant
  const session = await getServerSession(authOptions);
  let signup;

  if (session?.user?.id) {
    signup = await prisma.cruisingSignup.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
    });
  } else if (signupId) {
    signup = await prisma.cruisingSignup.findFirst({
      where: { id: signupId, eventId: id },
    });
  }

  const isAdmin = session?.user?.role === "ADMIN";
  if (!signup && !isAdmin) {
    return NextResponse.json({ error: "Du må være påmeldt for å laste opp bilder" }, { status: 403 });
  }

  // Upload to Supabase Storage — extension from validated MIME, never from filename
  const ext = extFromMime(file.type);
  const fileName = `cruising/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ error: "Opplasting feilet" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(fileName);

  const photo = await prisma.cruisingPhoto.create({
    data: {
      url: urlData.publicUrl,
      storagePath: fileName,
      comment,
      eventId: id,
      uploadedById: session?.user?.id || null,
      uploaderName: signup?.name || session?.user?.name || "Admin",
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(photo, { status: 201 });
}
