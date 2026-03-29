"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<{ id: string; title: string }[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    endDate: "",
    location: "",
    address: "",
    imageUrl: "",
    routeId: "",
    eventType: "GENERAL",
    isClubEvent: false,
    isPublished: false,
  });

  useEffect(() => {
    fetch("/api/admin/cruising")
      .then((res) => res.json())
      .then((data) => setRoutes(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function update(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/admin/arrangementer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Nytt arrangement</h2>
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
          <Label htmlFor="imageUrl">Bilde</Label>
          <div className="flex gap-2">
            <Input
              id="imageUrl"
              value={form.imageUrl}
              onChange={(e) => update("imageUrl", e.target.value)}
              placeholder="URL eller last opp"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = "image/*";
                input.onchange = async () => {
                  const file = input.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append("file", file);
                  const res = await fetch("/api/upload", { method: "POST", body: formData });
                  if (res.ok) {
                    const data = await res.json();
                    update("imageUrl", data.url);
                  }
                };
                input.click();
              }}
            >
              Last opp
            </Button>
          </div>
          {form.imageUrl && (
            <img src={form.imageUrl} alt="Forhåndsvisning" className="mt-2 h-32 rounded-lg object-cover" />
          )}
        </div>
        <div>
          <Label htmlFor="routeId">Rute (valgfritt)</Label>
          <select
            id="routeId"
            value={form.routeId}
            onChange={(e) => update("routeId", e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Ingen rute</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="eventType">Type arrangement</Label>
          <select
            id="eventType"
            value={form.eventType}
            onChange={(e) => update("eventType", e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="GENERAL">Generelt</option>
            <option value="AMCAR">Am-car treff</option>
            <option value="VETERAN">Veteranbiltreff</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isClubEvent"
            type="checkbox"
            checked={form.isClubEvent}
            onChange={(e) => update("isClubEvent", e.target.checked)}
            className="h-4 w-4 accent-hacbc-red"
          />
          <Label htmlFor="isClubEvent">Klubbarrangement (HACBC)</Label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isPublished"
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => update("isPublished", e.target.checked)}
            className="h-4 w-4 accent-hacbc-red"
          />
          <Label htmlFor="isPublished">Publiser med en gang</Label>
        </div>
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={loading} className="bg-hacbc-red hover:bg-hacbc-red/80">
            {loading ? "Lagrer..." : "Opprett arrangement"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Avbryt
          </Button>
        </div>
      </form>
    </div>
  );
}
