"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Album {
  id: string;
  title: string;
}

export default function UploadPhotosPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumId, setAlbumId] = useState("");
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/medlem/bilder?albums=true")
      .then((res) => res.json())
      .then((data) => {
        setAlbums(data.albums || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/medlem/bilder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ albumId, url, caption: caption || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || "Noe gikk galt");
        return;
      }

      setMessage("Bildet er lastet opp!");
      setUrl("");
      setCaption("");
    } catch {
      setMessage("Noe gikk galt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
        Last opp <span className="text-hacbc-red">bilder</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Del bilder fra treff og arrangementer med klubben.
      </p>

      <Card className="mt-6 border-border">
        <CardContent className="p-6">
          {loading ? (
            <p className="text-muted-foreground">Laster album...</p>
          ) : albums.length === 0 ? (
            <div className="text-center">
              <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                Det finnes ingen album ennå. En administrator må opprette et
                album først.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="album">Velg album *</Label>
                <Select value={albumId} onValueChange={(val) => setAlbumId(val ?? "")} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Velg et album" />
                  </SelectTrigger>
                  <SelectContent>
                    {albums.map((album) => (
                      <SelectItem key={album.id} value={album.id}>
                        {album.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="url">Bilde-URL *</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Lim inn en URL til bildet. Filopplasting med Supabase Storage
                  kommer senere.
                </p>
              </div>

              <div>
                <Label htmlFor="caption">Bildetekst</Label>
                <Input
                  id="caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Beskriv bildet..."
                />
              </div>

              {url && (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    Forhåndsvisning:
                  </p>
                  <img
                    src={url}
                    alt="Forhåndsvisning"
                    className="max-h-64 rounded-lg border border-border object-contain"
                  />
                </div>
              )}

              {message && (
                <p
                  className={`text-sm ${
                    message.includes("lastet opp")
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {message}
                </p>
              )}

              <Button type="submit" disabled={saving || !albumId}>
                {saving ? "Laster opp..." : "Last opp bilde"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
