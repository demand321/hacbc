import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { eventId, url, storagePath, comment } = await req.json();

  if (!eventId || !url) {
    return NextResponse.json(
      { error: "Mangler påkrevde felt" },
      { status: 400 }
    );
  }

  const photo = await prisma.cruisingPhoto.create({
    data: {
      url,
      storagePath: storagePath || "",
      comment: comment || null,
      eventId,
      uploadedById: session.user.id,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(photo, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id, comment } = await req.json();

  const photo = await prisma.cruisingPhoto.update({
    where: { id },
    data: { comment: comment || null },
  });

  return NextResponse.json(photo);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id } = await req.json();
  await prisma.cruisingPhoto.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
