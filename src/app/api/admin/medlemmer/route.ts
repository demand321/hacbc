import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { name, email, phone, password } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Navn, e-post og passord er påkrevd" },
      { status: 400 }
    );
  }

  if (password.length < 4) {
    return NextResponse.json(
      { error: "Passordet må være minst 4 tegn" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "E-postadressen er allerede registrert" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      role: "MEMBER",
      memberStatus: "APPROVED",
      memberSince: new Date(),
      mustChangePassword: true,
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { userId, action, password } = await req.json();

  switch (action) {
    case "approve":
      await prisma.user.update({
        where: { id: userId },
        data: { memberStatus: "APPROVED", memberSince: new Date() },
      });
      break;
    case "reject":
      await prisma.user.update({
        where: { id: userId },
        data: { memberStatus: "REJECTED" },
      });
      break;
    case "make-admin":
      await prisma.user.update({
        where: { id: userId },
        data: { role: "ADMIN" },
      });
      break;
    case "remove-admin":
      await prisma.user.update({
        where: { id: userId },
        data: { role: "MEMBER" },
      });
      break;
    case "reset-password": {
      if (!password || password.length < 4) {
        return NextResponse.json(
          { error: "Passordet må være minst 4 tegn" },
          { status: 400 }
        );
      }
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash, mustChangePassword: true },
      });
      break;
    }
    default:
      return NextResponse.json({ error: "Ugyldig handling" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
