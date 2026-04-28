import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-helpers";
import { isMimeAllowed, extFromMime, isValidId, ALLOWED_VIDEO_TYPES } from "@/lib/upload-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "uploads";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const albumId = formData.get("albumId") as string | null;

  if (!file || !albumId || !isValidId(albumId)) {
    return NextResponse.json({ error: "Mangler fil eller album" }, { status: 400 });
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

  const album = await prisma.album.findUnique({ where: { id: albumId }, select: { id: true } });
  if (!album) {
    return NextResponse.json({ error: "Ukjent album" }, { status: 404 });
  }

  const ext = extFromMime(file.type);
  const fileName = `gallery/${albumId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
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
      albumId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
