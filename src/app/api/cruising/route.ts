import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all active routes
    const routes = await prisma.cruisingRoute.findMany({
      where: { isActive: true },
      include: {
        waypoints: { orderBy: { sortOrder: "asc" } },
      },
    });

    // Get upcoming cruising events
    const upcoming = await prisma.cruisingEvent.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 10,
      include: {
        route: {
          include: { waypoints: { orderBy: { sortOrder: "asc" } } },
        },
        signups: { select: { id: true } },
      },
    });

    // Get past cruising events with photos
    const past = await prisma.cruisingEvent.findMany({
      where: { date: { lt: new Date() } },
      orderBy: { date: "desc" },
      take: 20,
      include: {
        route: { select: { title: true } },
        photos: {
          orderBy: { createdAt: "asc" },
          include: { uploadedBy: { select: { name: true } } },
        },
      },
    });

    return NextResponse.json({ routes, upcoming, past });
  } catch (err) {
    console.error("Cruising API error:", err);
    return NextResponse.json(
      { error: "Kunne ikke hente cruising-data", detail: String(err) },
      { status: 500 }
    );
  }
}
