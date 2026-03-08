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

  const routes = await prisma.cruisingRoute.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      waypoints: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { title, description, isActive, waypoints } = await req.json();

  const route = await prisma.cruisingRoute.create({
    data: {
      title,
      description: description || null,
      isActive: isActive ?? true,
      waypoints: {
        create: (waypoints ?? []).map(
          (wp: { name: string; lat: number; lng: number; note?: string; sortOrder: number }) => ({
            name: wp.name,
            lat: wp.lat,
            lng: wp.lng,
            note: wp.note || null,
            sortOrder: wp.sortOrder,
          })
        ),
      },
    },
    include: { waypoints: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(route);
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id, title, description, isActive, waypoints } = await req.json();

  // Delete existing waypoints and recreate
  await prisma.waypoint.deleteMany({ where: { routeId: id } });

  const route = await prisma.cruisingRoute.update({
    where: { id },
    data: {
      title,
      description: description || null,
      isActive: isActive ?? true,
      waypoints: {
        create: (waypoints ?? []).map(
          (wp: { name: string; lat: number; lng: number; note?: string; sortOrder: number }) => ({
            name: wp.name,
            lat: wp.lat,
            lng: wp.lng,
            note: wp.note || null,
            sortOrder: wp.sortOrder,
          })
        ),
      },
    },
    include: { waypoints: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json(route);
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  const { id } = await req.json();

  await prisma.cruisingRoute.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
