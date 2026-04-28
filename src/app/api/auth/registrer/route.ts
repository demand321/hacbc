import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`registrer:${ip}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl);

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

    // Always return the same generic response to prevent account enumeration.
    // If the email is taken, silently no-op so attackers can't probe the member list.
    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: {
          name: String(name).slice(0, 100),
          email: String(email).toLowerCase().slice(0, 200),
          phone: phone ? String(phone).slice(0, 30) : null,
          address: address ? String(address).slice(0, 200) : null,
          postalCode: postalCode ? String(postalCode).slice(0, 20) : null,
          city: city ? String(city).slice(0, 100) : null,
          passwordHash,
          role: "MEMBER",
          memberStatus: "PENDING",
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Noe gikk galt" },
      { status: 500 }
    );
  }
}
