import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { title, description, url, storagePath, fileName, fileSize, mimeType } = await req.json();

  if (!title?.trim() || !url || !storagePath || !fileName) {
    return NextResponse.json({ error: "Mangler påkrevde felt" }, { status: 400 });
  }

  const document = await prisma.clubDocument.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      url,
      storagePath,
      fileName,
      fileSize: fileSize || 0,
      mimeType: mimeType || "application/octet-stream",
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(document, { status: 201 });
}
