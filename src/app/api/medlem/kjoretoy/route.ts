import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ vehicles });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const body = await request.json();
  const { make, model, year, description, specs, imageUrls } = body;

  if (!make || !model) {
    return NextResponse.json(
      { error: "Merke og modell er påkrevd" },
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
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(vehicle, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID mangler" }, { status: 400 });
  }

  // Verify ownership
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
