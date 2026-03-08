import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
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
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone, avatarUrl } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Navn er påkrevd" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      avatarUrl: avatarUrl?.trim() || null,
    },
    select: { name: true, phone: true, avatarUrl: true },
  });

  return NextResponse.json(user);
}
