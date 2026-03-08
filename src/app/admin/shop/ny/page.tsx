"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreateEditProductPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);
  const [form, setForm] = useState({
    name: "",
    description: "",
    priceKr: "",
    imageUrls: "",
    inStock: true,
  });

  useEffect(() => {
    if (!editId) return;
    async function load() {
      const res = await fetch(`/api/admin/shop?id=${editId}`);
      if (res.ok) {
        const product = await res.json();
        setForm({
          name: product.name ?? "",
          description: product.description ?? "",
          priceKr: String(product.price / 100),
          imageUrls: (product.imageUrls ?? []).join("\n"),
          inStock: product.inStock ?? true,
        });
      }
      setFetching(false);
    }
    load();
  }, [editId]);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const priceOre = Math.round(parseFloat(form.priceKr) * 100);
    const imageUrls = form.imageUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    const body = {
      ...(editId ? { id: editId } : {}),
      name: form.name,
      description: form.description || null,
      price: priceOre,
      imageUrls,
      inStock: form.inStock,
    };

    const res = await fetch("/api/admin/shop", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/admin/shop");
      router.refresh();
    } else {
      setLoading(false);
      alert("Noe gikk galt. Prøv igjen.");
    }
  }

  if (fetching) {
    return <p className="text-muted-foreground">Laster produkt...</p>;
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">
        {editId ? "Rediger produkt" : "Nytt produkt"}
      </h2>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <Label htmlFor="name">Navn *</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="description">Beskrivelse</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="priceKr">Pris (NOK) *</Label>
          <Input
            id="priceKr"
            type="number"
            step="1"
            min="0"
            required
            value={form.priceKr}
            onChange={(e) => update("priceKr", e.target.value)}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Oppgi pris i hele kroner. Lagres som øre internt.
          </p>
        </div>
        <div>
          <Label htmlFor="imageUrls">Bilde-URLer (en per linje)</Label>
          <Textarea
            id="imageUrls"
            rows={3}
            value={form.imageUrls}
            onChange={(e) => update("imageUrls", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="inStock"
            type="checkbox"
            checked={form.inStock}
            onChange={(e) => update("inStock", e.target.checked)}
            className="h-4 w-4 accent-hacbc-red"
          />
          <Label htmlFor="inStock">På lager</Label>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="bg-hacbc-red hover:bg-hacbc-red/80">
            {loading ? "Lagrer..." : editId ? "Lagre endringer" : "Opprett produkt"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Avbryt
          </Button>
        </div>
      </form>
    </div>
  );
}
