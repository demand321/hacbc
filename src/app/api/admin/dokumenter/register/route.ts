import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { isStoragePathUnder, isMimeAllowed } from "@/lib/upload-security";

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
  const { title, description, storagePath, fileName, fileSize, mimeType } = body as {
    title?: string;
    description?: string;
    storagePath?: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  };

  if (!title?.trim() || !storagePath || !fileName) {
    return NextResponse.json({ error: "Mangler påkrevde felt" }, { status: 400 });
  }
  if (!isStoragePathUnder(storagePath, "documents")) {
    return NextResponse.json({ error: "Ugyldig storagePath" }, { status: 400 });
  }
  if (!mimeType || !isMimeAllowed(mimeType, "document")) {
    return NextResponse.json({ error: "Ugyldig dokumenttype" }, { status: 400 });
  }

  // Verify file exists
  const folder = storagePath.substring(0, storagePath.lastIndexOf("/"));
  const fileNameInStorage = storagePath.substring(storagePath.lastIndexOf("/") + 1);
  const { data: list } = await supabase.storage.from(BUCKET).list(folder, {
    search: fileNameInStorage,
    limit: 1,
  });
  if (!list || list.length === 0) {
    return NextResponse.json({ error: "Filen ble ikke funnet" }, { status: 404 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const document = await prisma.clubDocument.create({
    data: {
      title: title.trim().slice(0, 200),
      description: description?.toString().trim().slice(0, 1000) || null,
      url: urlData.publicUrl,
      storagePath,
      fileName: fileName.toString().slice(0, 200),
      fileSize: typeof fileSize === "number" && fileSize >= 0 ? fileSize : 0,
      mimeType,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
