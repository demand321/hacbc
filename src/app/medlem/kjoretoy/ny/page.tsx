"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface Spec {
  key: string;
  value: string;
}

export default function NewVehiclePage() {
  const router = useRouter();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [published, setPublished] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function addSpec() {
    setSpecs([...specs, { key: "", value: "" }]);
  }

  function removeSpec(index: number) {
    setSpecs(specs.filter((_, i) => i !== index));
  }

  function updateSpec(index: number, field: "key" | "value", val: string) {
    const updated = [...specs];
    updated[index][field] = val;
    setSpecs(updated);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setImageUrls((prev) => [...prev, data.url]);
        } else {
          const data = await res.json();
          setError(data.error || "Opplasting feilet");
        }
      } catch {
        setError("Opplasting feilet");
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
    setSaving(true);
    setError("");

    const specsObj: Record<string, string> = {};
    specs.forEach((s) => {
      if (s.key.trim()) specsObj[s.key.trim()] = s.value.trim();
    });

    try {
      const res = await fetch("/api/medlem/kjoretoy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
        return;
      }

      router.push("/medlem/kjoretoy");
      router.refresh();
    } catch {
      setError("Noe gikk galt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
        Registrer nytt <span className="text-primary">kjøretøy</span>
      </h1>

      <Card className="mt-6 border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="make">Merke *</Label>
                <Input
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="F.eks. Chevrolet"
                  required
                />
              </div>
              <div>
                <Label htmlFor="model">Modell *</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="F.eks. Camaro"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="year">Årsmodell</Label>
              <Input
                id="year"
                type="number"
                min="1900"
                max="2030"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="F.eks. 1969"
              />
            </div>

            <div>
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Fortell om kjøretøyet ditt..."
                rows={4}
              />
            </div>

            {/* Specs */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Spesifikasjoner</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                  <Plus className="mr-1 h-3 w-3" />
                  Legg til
                </Button>
              </div>
              {specs.map((spec, i) => (
                <div key={i} className="mt-2 flex items-center gap-2">
                  <Input
                    placeholder="Egenskap (f.eks. Motor)"
                    value={spec.key}
                    onChange={(e) => updateSpec(i, "key", e.target.value)}
                  />
                  <Input
                    placeholder="Verdi (f.eks. 350ci V8)"
                    value={spec.value}
                    onChange={(e) => updateSpec(i, "value", e.target.value)}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeSpec(i)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Image upload */}
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

            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Lagrer..." : "Registrer kjøretøy"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Avbryt
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
