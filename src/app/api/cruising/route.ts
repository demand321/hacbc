import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const upcoming = await prisma.cruisingEvent.findMany({
      where: { date: { gte: new Date() } },
      orderBy: { date: "asc" },
      take: 10,
      include: {
        route: { select: { title: true } },
        signups: { select: { id: true } },
      },
    });

    const past = await prisma.cruisingEvent.findMany({
      where: { date: { lt: new Date() } },
      orderBy: { date: "desc" },
      take: 20,
      include: {
        route: { select: { title: true } },
        signups: { select: { id: true } },
        photos: { select: { id: true } },
      },
    });

    return NextResponse.json({ upcoming, past });
  } catch (err) {
    console.error("Cruising API error:", err);
    return NextResponse.json(
      { error: "Kunne ikke hente cruising-data" },
      { status: 500 }
    );
  }
}
