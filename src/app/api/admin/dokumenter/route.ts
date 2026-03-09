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
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.memberStatus !== "APPROVED") {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const documents = await prisma.clubDocument.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(documents);
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string | null;
  const description = formData.get("description") as string | null;

  if (!file || !title?.trim()) {
    return NextResponse.json({ error: "Mangler fil eller tittel" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Maks 50MB per fil" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "pdf";
  const storagePath = `documents/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json({ error: "Opplasting feilet" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  const document = await prisma.clubDocument.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      url: urlData.publicUrl,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(document, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id, title, description } = await req.json();
  if (!id || !title?.trim()) {
    return NextResponse.json({ error: "Mangler id eller tittel" }, { status: 400 });
  }

  const document = await prisma.clubDocument.update({
    where: { id },
    data: { title: title.trim(), description: description?.trim() || null },
  });

  return NextResponse.json(document);
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id } = await req.json();

  const doc = await prisma.clubDocument.findUnique({ where: { id } });
  if (!doc) {
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }

  if (doc.storagePath) {
    await supabase.storage.from(BUCKET).remove([doc.storagePath]);
  }

  await prisma.clubDocument.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
