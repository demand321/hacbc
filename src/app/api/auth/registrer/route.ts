import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, address, postalCode, city, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Navn, e-post og passord er påkrevd" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passordet må være minst 8 tegn" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

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
        address: address || null,
        postalCode: postalCode || null,
        city: city || null,
        passwordHash,
        role: "MEMBER",
        memberStatus: "PENDING",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Noe gikk galt" },
      { status: 500 }
    );
  }
}
