import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { userId, action } = await req.json();

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
    default:
      return NextResponse.json({ error: "Ugyldig handling" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
