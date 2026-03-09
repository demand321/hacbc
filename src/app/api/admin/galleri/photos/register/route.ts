import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { url, storagePath, albumId } = await req.json();

  if (!url || !storagePath || !albumId) {
    return NextResponse.json({ error: "Mangler data" }, { status: 400 });
  }

  const photo = await prisma.photo.create({
    data: {
      url,
      storagePath,
      albumId,
      uploadedById: session.user.id,
    },
  });

  return NextResponse.json(photo, { status: 201 });
}
