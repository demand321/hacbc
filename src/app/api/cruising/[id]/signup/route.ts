import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const session = await getServerSession(authOptions);

  // Logged-in members use their session name
  const name = session?.user?.name || (body.name || "").trim();
  const phone = (body.phone || "").trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Navn er påkrevd" }, { status: 400 });
  }

  // Check event exists
  const event = await prisma.cruisingEvent.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Turen finnes ikke" }, { status: 404 });
  }

  // If logged in, check for duplicate signup
  if (session?.user?.id) {
    const existing = await prisma.cruisingSignup.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Du er allerede påmeldt" }, { status: 409 });
    }
  }

  const signup = await prisma.cruisingSignup.create({
    data: {
      eventId: id,
      userId: session?.user?.id || null,
      name,
      phone,
    },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json(signup, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  let signup;

  if (session?.user?.id) {
    // Logged-in user: find by userId
    signup = await prisma.cruisingSignup.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
    });
  } else {
    // Guest: find by signupId from body
    const body = await req.json().catch(() => ({}));
    if (body.signupId) {
      signup = await prisma.cruisingSignup.findFirst({
        where: { id: body.signupId, eventId: id, userId: null },
      });
    }
  }

  if (!signup) {
    return NextResponse.json({ error: "Ikke påmeldt" }, { status: 404 });
  }

  await prisma.cruisingSignup.delete({ where: { id: signup.id } });

  return NextResponse.json({ ok: true });
}
