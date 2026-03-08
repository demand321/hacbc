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

  const name = session?.user?.name || (body.name || "").trim();
  const phone = (body.phone || "").trim() || null;

  if (!name) {
    return NextResponse.json({ error: "Navn er påkrevd" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) {
    return NextResponse.json({ error: "Arrangementet finnes ikke" }, { status: 404 });
  }

  if (session?.user?.id) {
    const existing = await prisma.eventSignup.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "Du er allerede påmeldt" }, { status: 409 });
    }
  }

  const signup = await prisma.eventSignup.create({
    data: {
      eventId: id,
      userId: session?.user?.id || null,
      name,
      phone,
    },
    select: { id: true, name: true, userId: true, createdAt: true },
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
    signup = await prisma.eventSignup.findUnique({
      where: { eventId_userId: { eventId: id, userId: session.user.id } },
    });
  } else {
    const body = await req.json().catch(() => ({}));
    if (body.signupId) {
      signup = await prisma.eventSignup.findFirst({
        where: { id: body.signupId, eventId: id, userId: null },
      });
    }
  }

  if (!signup) {
    return NextResponse.json({ error: "Ikke påmeldt" }, { status: 404 });
  }

  await prisma.eventSignup.delete({ where: { id: signup.id } });

  return NextResponse.json({ ok: true });
}
