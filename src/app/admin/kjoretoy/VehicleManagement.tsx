"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Upload, Trash2, Pencil, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface Spec {
  key: string;
  value: string;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number | null;
  description: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  specs: any;
  imageUrls: string[];
  published: boolean;
  ownerId: string;
  owner: { id: string; name: string | null };
}

interface Member {
  id: string;
  name: string | null;
}

interface Props {
  vehicles: Vehicle[];
  members: Member[];
}

export function VehicleManagement({ vehicles: initialVehicles, members }: Props) {
  const router = useRouter();
  const [vehicles, setVehicles] = useState(initialVehicles);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [ownerId, setOwnerId] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [published, setPublished] = useState(true);
  const [uploading, setUploading] = useState(false);

  function resetForm() {
    setOwnerId("");
    setMake("");
    setModel("");
    setYear("");
    setDescription("");
    setSpecs([]);
    setImageUrls([]);
    setPublished(true);
    setEditingId(null);
    setError("");
  }

  function openNew() {
    resetForm();
    setShowForm(true);
  }

  function openEdit(v: Vehicle) {
    setEditingId(v.id);
    setOwnerId(v.ownerId);
    setMake(v.make);
    setModel(v.model);
    setYear(v.year?.toString() || "");
    setDescription(v.description || "");
    const specsRecord = v.specs as Record<string, string> | null;
    setSpecs(
      specsRecord
        ? Object.entries(specsRecord).map(([key, value]) => ({ key, value }))
        : []
    );
    setImageUrls(v.imageUrls || []);
    setPublished(v.published);
    setShowForm(true);
    setError("");
  }

  function cancel() {
    setShowForm(false);
    resetForm();
  }

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

    const payload = {
      ...(editingId ? { id: editingId } : {}),
      ownerId,
      make,
      model,
      year: year ? parseInt(year) : null,
      description: description || null,
      specs: Object.keys(specsObj).length > 0 ? specsObj : null,
      imageUrls,
      published,
    };

    try {
      const res = await fetch("/api/admin/kjoretoy", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Noe gikk galt");
        return;
      }

      setShowForm(false);
      resetForm();
      router.refresh();
    } catch {
      setError("Noe gikk galt");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Er du sikker på at du vil slette dette kjøretøyet?")) return;

    try {
      const res = await fetch(`/api/admin/kjoretoy?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setVehicles(vehicles.filter((v) => v.id !== id));
      }
    } catch {
      setError("Kunne ikke slette");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {vehicles.length} kjøretøy registrert
        </p>
        {!showForm && (
          <Button onClick={openNew} size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Legg til kjøretøy
          </Button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardContent className="p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {editingId ? "Rediger kjøretøy" : "Nytt kjøretøy"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="owner">Eier *</Label>
                <select
                  id="owner"
                  value={ownerId}
                  onChange={(e) => setOwnerId(e.target.value)}
                  required
                  className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                >
                  <option value="">Velg medlem...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
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
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beskrivelse av kjøretøyet..."
                  rows={3}
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
                      placeholder="Egenskap"
                      value={spec.key}
                      onChange={(e) => updateSpec(i, "key", e.target.value)}
                    />
                    <Input
                      placeholder="Verdi"
                      value={spec.value}
                      onChange={(e) => updateSpec(i, "value", e.target.value)}
                    />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeSpec(i)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Images */}
              <div>
                <Label>Bilder</Label>
                <div className="mt-2 space-y-3">
                  {imageUrls.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {imageUrls.map((url, i) => (
                        <div key={i} className="group relative">
                          <img
                            src={url}
                            alt={`Bilde ${i + 1}`}
                            className="h-20 w-full rounded-md border border-border object-cover"
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
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 transition-colors hover:border-primary/50">
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
                  {saving ? "Lagrer..." : editingId ? "Oppdater" : "Legg til"}
                </Button>
                <Button type="button" variant="outline" onClick={cancel}>
                  Avbryt
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Vehicle list */}
      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Car className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">Ingen kjøretøy registrert ennå.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vehicles.map((v) => (
            <Card key={v.id} className="border-border">
              <CardContent className="flex items-center gap-4 p-4">
                {v.imageUrls[0] ? (
                  <img
                    src={v.imageUrls[0]}
                    alt={`${v.make} ${v.model}`}
                    className="h-16 w-24 flex-shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-24 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                    <Car className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold">
                    {v.year && `${v.year} `}{v.make} {v.model}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Eier: {v.owner?.name || "Ukjent"}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    {v.published ? (
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-500">Publisert</span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-500">Skjult</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(v)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
