import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const route = await prisma.cruisingRoute.findFirst({
      where: { isActive: true },
      include: {
        waypoints: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!route) {
      return NextResponse.json(null, { status: 404 });
    }

    return NextResponse.json(route);
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente cruisingrute" },
      { status: 500 }
    );
  }
}
