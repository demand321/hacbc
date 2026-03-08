"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function toLocalDatetime(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    location: "",
    address: "",
    imageUrl: "",
    isPublished: false,
  });

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/admin/arrangementer?id=${id}`);
      if (res.ok) {
        const event = await res.json();
        setForm({
          title: event.title ?? "",
          description: event.description ?? "",
          date: toLocalDatetime(event.date),
          endDate: toLocalDatetime(event.endDate),
          location: event.location ?? "",
          address: event.address ?? "",
          imageUrl: event.imageUrl ?? "",
          isPublished: event.isPublished ?? false,
        });
      }
      setFetching(false);
    }
    load();
  }, [id]);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/admin/arrangementer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        ...form,
        date: new Date(form.date).toISOString(),
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      }),
    });

    if (res.ok) {
      router.push("/admin/arrangementer");
      router.refresh();
    } else {
      setLoading(false);
      alert("Noe gikk galt. Prøv igjen.");
    }
  }

  if (fetching) {
    return <p className="text-muted-foreground">Laster arrangement...</p>;
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Rediger arrangement</h2>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div>
          <Label htmlFor="title">Tittel *</Label>
          <Input
            id="title"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="description">Beskrivelse</Label>
          <Textarea
            id="description"
            rows={5}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="date">Startdato *</Label>
            <Input
              id="date"
              type="datetime-local"
              required
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="endDate">Sluttdato</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={form.endDate}
              onChange={(e) => update("endDate", e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="location">Sted</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => update("location", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="imageUrl">Bilde-URL</Label>
          <Input
            id="imageUrl"
            type="url"
            value={form.imageUrl}
            onChange={(e) => update("imageUrl", e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isPublished"
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => update("isPublished", e.target.checked)}
            className="h-4 w-4 accent-hacbc-red"
          />
          <Label htmlFor="isPublished">Publisert</Label>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="bg-hacbc-red hover:bg-hacbc-red/80">
            {loading ? "Lagrer..." : "Lagre endringer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Avbryt
          </Button>
        </div>
      </form>
    </div>
  );
}
