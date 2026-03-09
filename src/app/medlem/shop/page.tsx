"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrls: string[];
  sizes: string[];
  variants: string[];
  inStock: boolean;
}

function formatNOK(priceInOre: number): string {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(priceInOre / 100);
}

export default function MemberShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/shop")
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Laster produkter...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold uppercase tracking-tight sm:text-5xl">
        Klubb<span className="text-primary">shop</span>
      </h1>
      <p className="mt-4 text-muted-foreground">
        Caps, luer, klær og tilbehør med HACBC-logo.
      </p>

      {products.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Ingen produkter ennå</h2>
          <p className="mt-2 text-muted-foreground">
            Shoppen er tom for øyeblikket. Sjekk tilbake senere!
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const sizes = product.sizes ?? [];
  const variants = product.variants ?? [];
  const hasSizes = sizes.length > 0;
  const hasVariants = variants.length > 0;

  const handleOrder = async () => {
    if (hasSizes && !selectedSize) {
      setError("Velg en størrelse");
      return;
    }
    if (hasVariants && !selectedVariant) {
      setError("Velg en variant");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/bestilling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          size: selectedSize || null,
          variant: selectedVariant || null,
          comment: comment.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Noe gikk galt");
      }
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Noe gikk galt");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setOpen(false);
    setSelectedSize("");
    setSelectedVariant("");
    setComment("");
    setError("");
    setSuccess(false);
  };

  return (
    <Card className="flex h-full flex-col border-border bg-card">
      <div className="relative aspect-square w-full overflow-hidden rounded-t-xl">
        {product.imageUrls.length > 0 ? (
          <img
            src={product.imageUrls[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="text-lg font-bold text-white">Utsolgt</span>
          </div>
        )}
      </div>
      <CardContent className="flex flex-1 flex-col pt-2">
        <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold uppercase">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {product.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-1">
          {hasSizes && sizes.map((s) => (
            <span key={s} className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground">
              {s}
            </span>
          ))}
          {hasVariants && variants.map((v) => (
            <span key={v} className="rounded border border-accent/30 bg-accent/5 px-1.5 py-0.5 text-xs text-muted-foreground">
              {v}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="text-lg font-bold text-primary">
            {formatNOK(product.price)}
          </span>
          <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : resetAndClose())}>
            <DialogTrigger
              render={
                <Button disabled={!product.inStock} size="sm" />
              }
            >
              Bestill
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  Bestill {product.name}
                </DialogTitle>
              </DialogHeader>
              {success ? (
                <div className="py-4 text-center">
                  <p className="text-lg font-semibold text-green-500">
                    Bestilling mottatt!
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Vi tar kontakt med deg.
                  </p>
                  <Button className="mt-4" onClick={resetAndClose}>
                    Lukk
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    {hasSizes && (
                      <div>
                        <Label>Størrelse *</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {sizes.map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() => { setSelectedSize(size); setError(""); }}
                              className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                                selectedSize === size
                                  ? "border-primary bg-primary/10 text-primary font-medium"
                                  : "border-border text-muted-foreground hover:border-primary/50"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {hasVariants && (
                      <div>
                        <Label>Variant *</Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {variants.map((variant) => (
                            <button
                              key={variant}
                              type="button"
                              onClick={() => { setSelectedVariant(variant); setError(""); }}
                              className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                                selectedVariant === variant
                                  ? "border-primary bg-primary/10 text-primary font-medium"
                                  : "border-border text-muted-foreground hover:border-primary/50"
                              }`}
                            >
                              {variant}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="order-comment">
                        Kommentar (valgfritt)
                      </Label>
                      <Textarea
                        id="order-comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Annen info..."
                        rows={2}
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={handleOrder}
                      disabled={submitting}
                    >
                      {submitting ? "Sender..." : "Send bestilling"}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
