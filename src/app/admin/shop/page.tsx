import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { OrderStatusSelect } from "./OrderStatusSelect";

export const dynamic = "force-dynamic";

export default async function AdminShopPage() {
  const [products, orders] = await Promise.all([
    prisma.product.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    }),
  ]);

  return (
    <div>
      {/* --- Products --- */}
      <div className="mb-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Produkter</h2>
          <Link href="/admin/shop/ny">
            <Button className="bg-hacbc-red hover:bg-hacbc-red/80">
              <Plus className="mr-2 h-4 w-4" />
              Nytt produkt
            </Button>
          </Link>
        </div>

        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>Pris</TableHead>
                <TableHead>Størrelser</TableHead>
                <TableHead>På lager</TableHead>
                <TableHead className="text-right">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Ingen produkter ennå.
                  </TableCell>
                </TableRow>
              )}
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{(product.price / 100).toFixed(0)} kr</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.sizes.length > 0 ? product.sizes.join(", ") : "—"}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        product.inStock
                          ? "bg-green-900/30 text-green-400"
                          : "bg-red-900/30 text-red-400"
                      }`}
                    >
                      {product.inStock ? "Ja" : "Nei"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/shop/ny?id=${product.id}`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* --- Orders --- */}
      <div>
        <h2 className="mb-6 text-xl font-semibold">Bestillinger</h2>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bruker</TableHead>
                <TableHead>Dato</TableHead>
                <TableHead>Varer</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Ingen bestillinger ennå.
                  </TableCell>
                </TableRow>
              )}
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.user.name}</TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString("nb-NO", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="max-w-[250px] text-sm text-muted-foreground">
                    {order.items
                      .map((i) => `${i.product.name}${i.size ? ` (${i.size})` : ""} x${i.quantity}`)
                      .join(", ")}
                    {order.note && (
                      <p className="mt-0.5 text-xs italic text-muted-foreground/70">
                        {order.note}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
