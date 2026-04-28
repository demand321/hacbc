import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { isStoragePathUnder } from "@/lib/upload-security";
import { MAX_CAPTION_LENGTH } from "@/lib/auth-helpers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "uploads";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { storagePath, comment, signupId } = body as {
    storagePath?: string;
    comment?: string;
    signupId?: string;
  };

  if (!storagePath || !isStoragePathUnder(storagePath, `cruising/${id}`)) {
    return NextResponse.json({ error: "Ugyldig storagePath" }, { status: 400 });
  }

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
    return NextResponse.json({ error: "Ikke tilgang" }, { status: 403 });
  }

  // Verify the file actually exists in storage (prevents registering arbitrary paths)
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

  const photo = await prisma.cruisingPhoto.create({
    data: {
      url: urlData.publicUrl,
      storagePath,
      comment: comment ? comment.toString().slice(0, MAX_CAPTION_LENGTH) : null,
      eventId: id,
      uploadedById: session?.user?.id || null,
      uploaderName: signup?.name || session?.user?.name || "Admin",
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(photo, { status: 201 });
}
