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
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Ikke funnet" }, { status: 404 });
    }
    return NextResponse.json(product);
  }

  const products = await prisma.product.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const product = await prisma.product.create({
      data: {
        name: body.name,
        description: body.description || null,
        price: body.price,
        imageUrls: body.imageUrls ?? [],
        sizes: body.sizes ?? [],
        inStock: body.inStock ?? true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("POST /api/admin/shop error:", error);
    return NextResponse.json({ error: "Kunne ikke opprette produkt" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...data } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description ?? undefined,
        price: data.price,
        imageUrls: data.imageUrls ?? undefined,
        sizes: data.sizes ?? undefined,
        inStock: data.inStock ?? undefined,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("PATCH /api/admin/shop error:", error);
    return NextResponse.json({ error: "Kunne ikke oppdatere produkt" }, { status: 500 });
  }
}
