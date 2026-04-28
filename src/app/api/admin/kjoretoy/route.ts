import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: { owner: { select: { id: true, name: true } } },
    });
    if (!vehicle) {
      return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    }
    return NextResponse.json(vehicle);
  }

  const vehicles = await prisma.vehicle.findMany({
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const body = await request.json();
  const { ownerId, make, model, year, description, specs, imageUrls, published } = body;

  if (!ownerId || !make || !model) {
    return NextResponse.json(
      { error: "Eier, merke og modell er påkrevd" },
      { status: 400 }
    );
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      make: make.trim(),
      model: model.trim(),
      year: year ? parseInt(year) : null,
      description: description?.trim() || null,
      specs: specs || undefined,
      imageUrls: imageUrls || [],
      ownerId,
      published: published ?? true,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ownerId, make, model, year, description, specs, imageUrls, published } = body;

  if (!id) {
    return NextResponse.json({ error: "ID mangler" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      ownerId: ownerId || undefined,
      make: make?.trim(),
      model: model?.trim(),
      year: year ? parseInt(year) : null,
      description: description?.trim() || null,
      specs: specs || undefined,
      imageUrls: imageUrls || [],
      published: published ?? undefined,
    },
  });

  return NextResponse.json(vehicle);
}

export async function DELETE(request: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID mangler" }, { status: 400 });
  }

  await prisma.vehicle.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
