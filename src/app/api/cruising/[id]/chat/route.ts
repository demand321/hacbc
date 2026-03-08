import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const after = req.nextUrl.searchParams.get("after");

  const messages = await prisma.cruisingMessage.findMany({
    where: {
      eventId: id,
      ...(after ? { createdAt: { gt: new Date(after) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: {
      signup: { select: { name: true } },
    },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const signupId = (body.signupId || "").trim();
  const content = (body.content || "").trim();

  if (!signupId || !content) {
    return NextResponse.json({ error: "Mangler data" }, { status: 400 });
  }

  // Verify signup belongs to this event
  const signup = await prisma.cruisingSignup.findFirst({
    where: { id: signupId, eventId: id },
  });

  if (!signup) {
    return NextResponse.json({ error: "Ikke påmeldt denne turen" }, { status: 403 });
  }

  const message = await prisma.cruisingMessage.create({
    data: { eventId: id, signupId, content },
    include: { signup: { select: { name: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
