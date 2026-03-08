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

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");

  if (id) {
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    }
    return NextResponse.json(event);
  }

  const events = await prisma.event.findMany({ orderBy: { date: "desc" } });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const body = await req.json();

  const event = await prisma.event.create({
    data: {
      title: body.title,
      description: body.description || null,
      date: new Date(body.date),
      endDate: body.endDate ? new Date(body.endDate) : null,
      location: body.location || null,
      address: body.address || null,
      imageUrl: body.imageUrl || null,
      isPublished: body.isPublished ?? false,
    },
  });

  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const body = await req.json();
  const { id, ...data } = body;

  const event = await prisma.event.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description || null,
      date: data.date ? new Date(data.date) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : null,
      location: data.location || null,
      address: data.address || null,
      imageUrl: data.imageUrl || null,
      isPublished: data.isPublished ?? undefined,
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id } = await req.json();

  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
