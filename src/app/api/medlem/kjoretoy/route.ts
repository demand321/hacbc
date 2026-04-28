import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApproved } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  // If ?id= is provided, return single vehicle (for edit page)
  const id = request.nextUrl.searchParams.get("id");
  if (id) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id } });
    if (!vehicle || vehicle.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    }
    return NextResponse.json(vehicle);
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { make, model, year, description, specs, imageUrls, published } = body;

  if (!make || !model) {
    return NextResponse.json(
      { error: "Merke og modell er påkrevd" },
      { status: 400 }
    );
  }

  const cleanImageUrls = Array.isArray(imageUrls)
    ? imageUrls.filter((u: unknown) => typeof u === "string").slice(0, 20)
    : [];
  const cleanSpecs = specs && typeof specs === "object" && !Array.isArray(specs)
    ? Object.fromEntries(
        Object.entries(specs)
          .slice(0, 50)
          .map(([k, v]) => [String(k).slice(0, 100), String(v).slice(0, 500)])
      )
    : undefined;

  const vehicle = await prisma.vehicle.create({
    data: {
      make: String(make).trim().slice(0, 100),
      model: String(model).trim().slice(0, 100),
      year: year ? parseInt(year) : null,
      description: description ? String(description).trim().slice(0, 2000) : null,
      specs: cleanSpecs,
      imageUrls: cleanImageUrls,
      ownerId: session.user.id,
      published: published ?? true,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { id, make, model, year, description, specs, imageUrls, published } = body;

  if (!id) {
    return NextResponse.json({ error: "ID mangler" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.vehicle.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }

  if (existing.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  }

  const cleanImageUrls = Array.isArray(imageUrls)
    ? imageUrls.filter((u: unknown) => typeof u === "string").slice(0, 20)
    : [];
  const cleanSpecs = specs && typeof specs === "object" && !Array.isArray(specs)
    ? Object.fromEntries(
        Object.entries(specs)
          .slice(0, 50)
          .map(([k, v]) => [String(k).slice(0, 100), String(v).slice(0, 500)])
      )
    : undefined;

  const vehicle = await prisma.vehicle.update({
    where: { id },
    data: {
      make: make ? String(make).trim().slice(0, 100) : undefined,
      model: model ? String(model).trim().slice(0, 100) : undefined,
      year: year ? parseInt(year) : null,
      description: description ? String(description).trim().slice(0, 2000) : null,
      specs: cleanSpecs,
      imageUrls: cleanImageUrls,
      published: published ?? undefined,
    },
  });

  return NextResponse.json(vehicle);
}

export async function DELETE(request: NextRequest) {
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID mangler" }, { status: 400 });
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { ownerId: true },
  });

  if (!vehicle) {
    return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
  }

  if (vehicle.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 403 });
  }

  await prisma.vehicle.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
