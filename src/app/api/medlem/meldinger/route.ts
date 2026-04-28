import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApproved, MAX_MESSAGE_LENGTH } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get("userId");

  if (userId) {
    // Get messages between current user and specified user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark unread messages from the other user as read
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: session.user.id,
        read: false,
      },
      data: { read: true },
    });

    // Get other user info
    const otherUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true },
    });

    return NextResponse.json({ messages, otherUser });
  }

  // Get all conversations (grouped by other user)
  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: session.user.id },
        { receiverId: session.user.id },
      ],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const body = await request.json();
  const { receiverId, content } = body;

  if (!receiverId || !content?.trim()) {
    return NextResponse.json(
      { error: "Mottaker og melding er påkrevd" },
      { status: 400 }
    );
  }

  if (receiverId === session.user.id) {
    return NextResponse.json(
      { error: "Du kan ikke sende melding til deg selv" },
      { status: 400 }
    );
  }

  // Verify receiver exists and is approved
  const receiver = await prisma.user.findUnique({
    where: { id: receiverId },
    select: { id: true, memberStatus: true },
  });

  if (!receiver || receiver.memberStatus !== "APPROVED") {
    return NextResponse.json(
      { error: "Mottaker ikke funnet" },
      { status: 404 }
    );
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      receiverId,
      content: content.trim().slice(0, MAX_MESSAGE_LENGTH),
    },
  });

  return NextResponse.json(message, { status: 201 });
}
