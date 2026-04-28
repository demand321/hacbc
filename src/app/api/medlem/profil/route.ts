import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApproved, MAX_NAME_LENGTH, MAX_PHONE_LENGTH } from "@/lib/auth-helpers";

export async function GET() {
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, phone: true, avatarUrl: true, email: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Bruker ikke funnet" }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { name, phone, avatarUrl } = body as {
    name?: string;
    phone?: string;
    avatarUrl?: string;
  };

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Navn er påkrevd" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name.trim().slice(0, MAX_NAME_LENGTH),
      phone: phone?.trim().slice(0, MAX_PHONE_LENGTH) || null,
      avatarUrl: avatarUrl?.trim().slice(0, 500) || null,
    },
    select: { name: true, phone: true, avatarUrl: true },
  });

  return NextResponse.json(user);
}
