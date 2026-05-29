import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendOrderNotificationEmail } from "@/lib/email";

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
    const { productId, comment, size, variant } = body;

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
            size: size?.trim() || null,
            variant: variant?.trim() || null,
          },
        },
      },
      include: {
        items: { include: { product: true } },
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    try {
      await sendOrderNotificationEmail({
        orderId: order.id,
        customerName: order.user.name,
        customerEmail: order.user.email,
        customerPhone: order.user.phone,
        note: order.note,
        items: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
          size: item.size,
          variant: item.variant,
          priceInOre: item.product.price,
        })),
      });
    } catch (err) {
      console.error("[bestilling] order notification failed:", err);
    }

    return NextResponse.json({ success: true, orderId: order.id });
  } catch {
    return NextResponse.json(
      { error: "Noe gikk galt ved opprettelse av bestilling" },
      { status: 500 }
    );
  }
}
