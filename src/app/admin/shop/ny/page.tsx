"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Upload, Trash2, GripVertical } from "lucide-react";

const COMMON_SIZES = ["One Size", "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

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
    sizes: [] as string[],
    variants: [] as string[],
    allVariants: [] as string[],
    inStock: true,
  });
  const [newVariant, setNewVariant] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!editId) return;
    async function load() {
      const res = await fetch(`/api/admin/shop?id=${editId}`);
      if (res.ok) {
        const product = await res.json();
        const activeVariants = product.variants ?? [];
        const allDefined = product.allVariants ?? [];
        // allVariants includes both active and inactive — merge to be safe
        const merged = Array.from(new Set([...allDefined, ...activeVariants]));
        setForm({
          name: product.name ?? "",
          description: product.description ?? "",
          priceKr: String(product.price / 100),
          imageUrls: (product.imageUrls ?? []).join("\n"),
          sizes: product.sizes ?? [],
          variants: activeVariants,
          allVariants: merged,
          inStock: product.inStock ?? true,
        });
      }
      setFetching(false);
    }
    load();
  }, [editId]);

  function toggleSize(size: string) {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  }

  function toggleVariant(variant: string) {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.includes(variant)
        ? prev.variants.filter((v) => v !== variant)
        : [...prev.variants, variant],
    }));
  }

  async function handleImageUpload(files: FileList) {
    setUploading(true);
    const currentUrls = form.imageUrls
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        currentUrls.push(data.url);
      }
    }

    setForm((p) => ({ ...p, imageUrls: currentUrls.join("\n") }));
    setUploading(false);
  }

  function removeImage(index: number) {
    const urls = form.imageUrls.split("\n").map((u) => u.trim()).filter(Boolean);
    urls.splice(index, 1);
    setForm((p) => ({ ...p, imageUrls: urls.join("\n") }));
  }

  function addVariant() {
    const v = newVariant.trim();
    if (!v) return;
    setForm((prev) => ({
      ...prev,
      allVariants: prev.allVariants.includes(v) ? prev.allVariants : [...prev.allVariants, v],
      variants: prev.variants.includes(v) ? prev.variants : [...prev.variants, v],
    }));
    setNewVariant("");
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
      sizes: form.sizes,
      variants: form.variants,
      allVariants: form.allVariants,
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
      const errData = await res.json().catch(() => ({}));
      setLoading(false);
      alert(errData.error || "Noe gikk galt. Prøv igjen.");
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
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="description">Beskrivelse</Label>
          <Textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
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
            onChange={(e) => setForm((p) => ({ ...p, priceKr: e.target.value }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Oppgi pris i hele kroner. Lagres som øre internt.
          </p>
        </div>

        {/* Sizes */}
        <div>
          <Label>Størrelser</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            Klikk for å aktivere/deaktivere. Aktive størrelser vises for kunden.
          </p>
          <div className="flex flex-wrap gap-2">
            {COMMON_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                  form.sizes.includes(size)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Variants */}
        <div>
          <Label>Varianter</Label>
          <p className="mb-2 text-xs text-muted-foreground">
            Klikk for å aktivere/deaktivere. Aktive varianter vises for kunden.
          </p>
          {form.allVariants.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {form.allVariants.map((variant) => (
                <button
                  key={variant}
                  type="button"
                  onClick={() => toggleVariant(variant)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    form.variants.includes(variant)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {variant}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input
              value={newVariant}
              onChange={(e) => setNewVariant(e.target.value)}
              placeholder="F.eks. Logo på oppbrett"
              className="w-64"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addVariant();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
              disabled={!newVariant.trim()}
            >
              <Plus className="mr-1 h-3 w-3" />
              Legg til
            </Button>
          </div>
        </div>

        {/* Images */}
        <div>
          <Label>Bilder</Label>
          <div className="mt-2 space-y-3">
            {form.imageUrls.split("\n").map((u) => u.trim()).filter(Boolean).length > 0 && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {form.imageUrls.split("\n").map((u) => u.trim()).filter(Boolean).map((url, i) => (
                  <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img
                      src={url}
                      alt={`Bilde ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.multiple = true;
                  input.onchange = () => {
                    if (input.files?.length) handleImageUpload(input.files);
                  };
                  input.click();
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Laster opp..." : "Last opp bilder"}
              </Button>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Eller legg inn URL-er manuelt
              </summary>
              <Textarea
                className="mt-2"
                rows={3}
                value={form.imageUrls}
                onChange={(e) => setForm((p) => ({ ...p, imageUrls: e.target.value }))}
                placeholder="En URL per linje"
              />
            </details>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="inStock"
            type="checkbox"
            checked={form.inStock}
            onChange={(e) => setForm((p) => ({ ...p, inStock: e.target.checked }))}
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
