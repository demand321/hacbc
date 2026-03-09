"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminGalleryUpload({ albumId }: { albumId: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function handleUpload(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const isLarge = file.size > 4 * 1024 * 1024;
      if (isLarge) {
        // Signed URL upload for large files (video)
        const signedRes = await fetch("/api/upload/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            contentType: file.type,
            folder: `gallery/${albumId}`,
          }),
        });
        if (!signedRes.ok) continue;
        const { signedUrl, storagePath, publicUrl } = await signedRes.json();
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!uploadRes.ok) continue;
        await fetch("/api/admin/galleri/photos/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: publicUrl, storagePath, albumId }),
        });
      } else {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("albumId", albumId);
        await fetch("/api/admin/galleri/photos", { method: "POST", body: formData });
      }
    }
    setUploading(false);
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={uploading}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,video/*";
        input.multiple = true;
        input.onchange = () => {
          if (input.files?.length) handleUpload(input.files);
        };
        input.click();
      }}
      className="absolute bottom-2 left-2 z-10 bg-black/70 text-white hover:bg-black/90"
    >
      <Upload className="mr-1.5 h-3 w-3" />
      {uploading ? "Laster opp..." : "Last opp"}
    </Button>
  );
}

export function AdminCreateAlbum() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);
    const res = await fetch("/api/admin/galleri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim() }),
    });
    if (res.ok) {
      setTitle("");
      setOpen(false);
      router.refresh();
    }
    setCreating(false);
  }

  if (!open) {
    return (
      <Button
        onClick={() => setOpen(true)}
        className="bg-hacbc-red hover:bg-hacbc-red/80"
      >
        <Plus className="mr-2 h-4 w-4" />
        Nytt album
      </Button>
    );
  }

  return (
    <form onSubmit={handleCreate} className="flex items-center gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Albumnavn..."
        className="w-48"
        autoFocus
      />
      <Button type="submit" disabled={creating} className="bg-hacbc-red hover:bg-hacbc-red/80">
        {creating ? "Oppretter..." : "Opprett"}
      </Button>
      <Button type="button" variant="outline" onClick={() => { setOpen(false); setTitle(""); }}>
        Avbryt
      </Button>
    </form>
  );
}
