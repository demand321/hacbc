import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { url, storagePath, comment, signupId } = await req.json();

  if (!url || !storagePath) {
    return NextResponse.json({ error: "Mangler data" }, { status: 400 });
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

  const photo = await prisma.cruisingPhoto.create({
    data: {
      url,
      storagePath,
      comment: comment || null,
      eventId: id,
      uploadedById: session?.user?.id || null,
      uploaderName: signup?.name || session?.user?.name || "Admin",
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(photo, { status: 201 });
}
