import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { eventId, storagePath, comment } = body as {
    eventId?: string;
    storagePath?: string;
    comment?: string;
  };

  if (!eventId) {
    return NextResponse.json({ error: "Mangler eventId" }, { status: 400 });
  }
  if (!storagePath || !storagePath.startsWith(`cruising/${eventId}/`) || storagePath.includes("..")) {
    return NextResponse.json({ error: "Ugyldig storagePath" }, { status: 400 });
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(storagePath);

  const photo = await prisma.cruisingPhoto.create({
    data: {
      url: urlData.publicUrl,
      storagePath,
      comment: comment ? comment.toString().slice(0, 500) : null,
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
