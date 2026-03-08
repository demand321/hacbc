import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const events = await prisma.cruisingEvent.findMany({
    orderBy: { date: "desc" },
    include: {
      route: { select: { id: true, title: true } },
      photos: {
        orderBy: { createdAt: "asc" },
        include: { uploadedBy: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { date, title, description, routeId } = await req.json();

  if (!date || !title) {
    return NextResponse.json(
      { error: "Dato og tittel er påkrevd" },
      { status: 400 }
    );
  }

  const event = await prisma.cruisingEvent.create({
    data: {
      date: new Date(date),
      title,
      description: description || null,
      routeId: routeId || null,
    },
    include: {
      route: { select: { id: true, title: true } },
      photos: true,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id, date, title, description, routeId } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "ID mangler" }, { status: 400 });
  }

  const event = await prisma.cruisingEvent.update({
    where: { id },
    data: {
      date: date ? new Date(date) : undefined,
      title,
      description: description || null,
      routeId: routeId || null,
    },
    include: {
      route: { select: { id: true, title: true } },
      photos: {
        orderBy: { createdAt: "asc" },
        include: { uploadedBy: { select: { name: true } } },
      },
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id } = await req.json();
  await prisma.cruisingEvent.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
