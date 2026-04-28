import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isStoragePathUnder, isValidId } from "@/lib/upload-security";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "uploads";

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { storagePath, albumId } = body as {
    storagePath?: string;
    albumId?: string;
  };

  if (!albumId || !isValidId(albumId)) {
    return NextResponse.json({ error: "Ugyldig album-id" }, { status: 400 });
  }
  if (!storagePath || !isStoragePathUnder(storagePath, `gallery/${albumId}`)) {
    return NextResponse.json({ error: "Ugyldig storagePath" }, { status: 400 });
  }

  const album = await prisma.album.findUnique({ where: { id: albumId }, select: { id: true } });
  if (!album) {
    return NextResponse.json({ error: "Ukjent album" }, { status: 404 });
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

  const photo = await prisma.photo.create({
    data: {
      url: urlData.publicUrl,
      storagePath,
      albumId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
