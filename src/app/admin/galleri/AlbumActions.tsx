"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Trash2, ImageIcon, Upload, Eye } from "lucide-react";

interface AlbumItem {
  id: string;
  title: string;
  photoCount: number;
  eventTitle: string | null;
  createdAt: string;
}

interface EventItem {
  id: string;
  title: string;
}

export function AlbumActions({
  albums,
  events,
}: {
  albums: AlbumItem[];
  events: EventItem[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [eventId, setEventId] = useState("");
  const [creating, setCreating] = useState(false);
  const [uploadingAlbumId, setUploadingAlbumId] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);

    const res = await fetch("/api/admin/galleri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        eventId: eventId || null,
      }),
    });

    if (res.ok) {
      setTitle("");
      setEventId("");
      router.refresh();
    }
    setCreating(false);
  }

  async function handleDelete(albumId: string) {
    if (!confirm("Er du sikker? Alle bilder i albumet slettes.")) return;
    await fetch("/api/admin/galleri", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: albumId }),
    });
    router.refresh();
  }

  async function handleUpload(albumId: string, files: FileList) {
    setUploadingAlbumId(albumId);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("albumId", albumId);
      await fetch("/api/admin/galleri/photos", { method: "POST", body: formData });
    }
    setUploadingAlbumId(null);
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Create form */}
      <form onSubmit={handleCreate} className="max-w-md space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Nytt album</h3>
        <div>
          <Label htmlFor="albumTitle">Tittel *</Label>
          <Input
            id="albumTitle"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="eventLink">Koble til arrangement (valgfritt)</Label>
          <select
            id="eventLink"
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Ingen</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" disabled={creating} className="bg-hacbc-red hover:bg-hacbc-red/80">
          <Plus className="mr-2 h-4 w-4" />
          {creating ? "Oppretter..." : "Opprett album"}
        </Button>
      </form>

      {/* Album list */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {albums.length === 0 && (
          <p className="text-muted-foreground">Ingen album ennå.</p>
        )}
        {albums.map((album) => (
          <Card key={album.id} className="border-border">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <ImageIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{album.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {album.photoCount} bilder
                    </p>
                    {album.eventTitle && (
                      <p className="text-xs text-hacbc-red">{album.eventTitle}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(album.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/galleri/${album.id}`}>
                    <Eye className="mr-1.5 h-3 w-3" />
                    Se bilder
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploadingAlbumId === album.id}
                  onClick={() => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.multiple = true;
                    input.onchange = () => {
                      if (input.files?.length) handleUpload(album.id, input.files);
                    };
                    input.click();
                  }}
                >
                  <Upload className="mr-1.5 h-3 w-3" />
                  {uploadingAlbumId === album.id ? "Laster opp..." : "Last opp"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
