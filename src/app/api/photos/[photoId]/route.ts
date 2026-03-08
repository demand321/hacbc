import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const session = await getServerSession(authOptions);
  const type = req.nextUrl.searchParams.get("type") || "gallery";
  const isAdmin = session?.user?.role === "ADMIN";

  if (type === "cruising") {
    const photo = await prisma.cruisingPhoto.findUnique({ where: { id: photoId } });
    if (!photo) {
      return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    }

    // Admin or photo owner can delete
    if (!isAdmin && photo.uploadedById !== session?.user?.id) {
      return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
    }

    // Delete from storage
    if (photo.storagePath) {
      await supabase.storage.from("uploads").remove([photo.storagePath]);
    }

    await prisma.cruisingPhoto.delete({ where: { id: photoId } });
  } else {
    const photo = await prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) {
      return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    }

    if (!isAdmin && photo.uploadedById !== session?.user?.id) {
      return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
    }

    if (photo.storagePath) {
      await supabase.storage.from("uploads").remove([photo.storagePath]);
    }

    await prisma.photo.delete({ where: { id: photoId } });
  }

  return NextResponse.json({ ok: true });
}
