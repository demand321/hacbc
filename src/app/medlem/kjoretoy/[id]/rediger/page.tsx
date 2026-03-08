"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, ArrowLeft, Upload } from "lucide-react";

interface SpecEntry {
  key: string;
  value: string;
}

export default function EditVehiclePage() {
  const router = useRouter();
  const params = useParams();
  const vehicleId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState<SpecEntry[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [published, setPublished] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/medlem/kjoretoy?id=${vehicleId}`);
      if (!res.ok) {
        setError("Kunne ikke laste kjøretøy");
        setLoading(false);
        return;
      }
      const vehicle = await res.json();
      setMake(vehicle.make);
      setModel(vehicle.model);
      setYear(vehicle.year?.toString() ?? "");
      setDescription(vehicle.description ?? "");
      setImageUrls(vehicle.imageUrls ?? []);
      setPublished(vehicle.published ?? true);
      if (vehicle.specs && typeof vehicle.specs === "object") {
        setSpecs(
          Object.entries(vehicle.specs).map(([key, value]) => ({
            key,
            value: String(value),
          }))
        );
      }
      setLoading(false);
    }
    load();
  }, [vehicleId]);

  function addSpec() {
    setSpecs([...specs, { key: "", value: "" }]);
  }

  function removeSpec(index: number) {
    setSpecs(specs.filter((_, i) => i !== index));
  }

  function updateSpec(index: number, field: "key" | "value", val: string) {
    setSpecs(specs.map((s, i) => (i === index ? { ...s, [field]: val } : s)));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setImageUrls((prev) => [...prev, data.url]);
      }
    }
    setUploading(false);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const specsObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim()) specsObj[s.key.trim()] = s.value;
    });

    const res = await fetch("/api/medlem/kjoretoy", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: vehicleId,
        make,
        model,
        year: year ? parseInt(year) : null,
        description: description || null,
        specs: Object.keys(specsObj).length > 0 ? specsObj : null,
        imageUrls,
        published,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Noe gikk galt");
      setSaving(false);
      return;
    }

    router.push("/medlem/kjoretoy");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-muted-foreground">Laster...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Button
        variant="ghost"
        className="mb-6"
        onClick={() => router.push("/medlem/kjoretoy")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tilbake
      </Button>

      <h1 className="mb-8 font-[family-name:var(--font-heading)] text-3xl font-bold uppercase">
        Rediger <span className="text-primary">kjøretøy</span>
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="make">Merke *</Label>
            <Input
              id="make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              required
              placeholder="Chevrolet"
            />
          </div>
          <div>
            <Label htmlFor="model">Modell *</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              required
              placeholder="Corvette"
            />
          </div>
          <div>
            <Label htmlFor="year">Årsmodell</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="1969"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="description">Beskrivelse</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Fortell om kjøretøyet..."
          />
        </div>

        {/* Specs */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <Label>Spesifikasjoner</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSpec}>
              <Plus className="mr-1 h-3 w-3" />
              Legg til
            </Button>
          </div>
          <div className="space-y-2">
            {specs.map((spec, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="F.eks. Motor"
                  value={spec.key}
                  onChange={(e) => updateSpec(i, "key", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="F.eks. 350 cui"
                  value={spec.value}
                  onChange={(e) => updateSpec(i, "value", e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSpec(i)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Images */}
        <div>
          <Label>Bilder</Label>
          <div className="mt-2 space-y-3">
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="group relative">
                    <img
                      src={url}
                      alt={`Bilde ${i + 1}`}
                      className="h-24 w-full rounded-md border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <Trash2 className="h-3 w-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-6 transition-colors hover:border-primary/50">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {uploading ? "Laster opp..." : "Klikk for å laste opp bilder"}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="published"
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="h-4 w-4"
          />
          <Label htmlFor="published">Vis offentlig i kjøretøygalleriet</Label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? "Lagrer..." : "Lagre endringer"}
        </Button>
      </form>
    </div>
  );
}
