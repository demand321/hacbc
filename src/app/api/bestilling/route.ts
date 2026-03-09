import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Du må være innlogget for å bestille" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { productId, comment } = body;

    if (!productId) {
      return NextResponse.json(
        { error: "Produkt-ID er påkrevd" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produktet finnes ikke" },
        { status: 404 }
      );
    }

    if (!product.inStock) {
      return NextResponse.json(
        { error: "Produktet er utsolgt" },
        { status: 400 }
      );
    }

    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        note: comment?.trim() || null,
        items: {
          create: {
            productId: product.id,
            quantity: 1,
          },
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    return NextResponse.json({ success: true, orderId: order.id });
  } catch {
    return NextResponse.json(
      { error: "Noe gikk galt ved opprettelse av bestilling" },
      { status: 500 }
    );
  }
}
