import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { inStock: true },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        imageUrls: true,
        sizes: true,
        variants: true,
        inStock: true,
      },
    });

    return NextResponse.json(products);
  } catch {
    return NextResponse.json(
      { error: "Kunne ikke hente produkter" },
      { status: 500 }
    );
  }
}
