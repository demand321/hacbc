import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { rateLimit, getClientIp, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ikke innlogget" }, { status: 401 });
  }

  // Throttle: 5 password-change attempts per user per 15 min
  const rl = rateLimit(`bytt-passord:${session.user.id}:${getClientIp(req)}`, 5, 15 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl);

  const body = await req.json().catch(() => ({}));
  const { currentPassword, newPassword } = body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { error: "Passordet må være minst 8 tegn" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true, mustChangePassword: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Bruker ikke funnet" }, { status: 404 });
  }

  // Skip current-password check if user was forced to change (admin reset / first login)
  if (!user.mustChangePassword) {
    if (typeof currentPassword !== "string" || currentPassword.length === 0) {
      return NextResponse.json(
        { error: "Nåværende passord er påkrevd" },
        { status: 400 }
      );
    }
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Nåværende passord er feil" },
        { status: 403 }
      );
    }
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash, mustChangePassword: false },
  });

  return NextResponse.json({ success: true });
}
