"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Trash2,
  FileText,
  Pencil,
  Check,
  X,
  Download,
  File,
} from "lucide-react";

interface DocumentItem {
  id: string;
  title: string;
  description: string | null;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document")) return "DOC";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "XLS";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "PPT";
  if (mimeType.includes("image")) return "IMG";
  if (mimeType.includes("text")) return "TXT";
  return "FIL";
}

export function DocumentActions({ documents }: { documents: DocumentItem[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !title.trim()) return;
    setUploading(true);

    const isLarge = file.size > 4 * 1024 * 1024;

    if (isLarge) {
      // Signed URL upload for large files
      const signedRes = await fetch("/api/upload/signed-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "documents",
          contentType: file.type,
          size: file.size,
        }),
      });
      if (signedRes.ok) {
        const { signedUrl, storagePath, publicUrl } = await signedRes.json();
        const uploadRes = await fetch(signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (uploadRes.ok) {
          await fetch("/api/admin/dokumenter/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title.trim(),
              description: description.trim() || null,
              url: publicUrl,
              storagePath,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
            }),
          });
        }
      }
    } else {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", title.trim());
      if (description.trim()) formData.append("description", description.trim());
      await fetch("/api/admin/dokumenter", { method: "POST", body: formData });
    }

    setTitle("");
    setDescription("");
    setFile(null);
    setUploading(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Er du sikker på at du vil slette dette dokumentet?")) return;
    await fetch("/api/admin/dokumenter", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    router.refresh();
  }

  async function handleEdit(id: string) {
    if (!editTitle.trim()) return;
    const res = await fetch("/api/admin/dokumenter", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
      }),
    });
    if (res.ok) {
      setEditingId(null);
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      {/* Upload form */}
      <form onSubmit={handleUpload} className="max-w-md space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">
          Last opp dokument
        </h3>
        <div>
          <Label htmlFor="docTitle">Tittel *</Label>
          <Input
            id="docTitle"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="F.eks. Vedtekter 2025"
          />
        </div>
        <div>
          <Label htmlFor="docDescription">Beskrivelse (valgfritt)</Label>
          <Input
            id="docDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Kort beskrivelse av dokumentet"
          />
        </div>
        <div>
          <Label htmlFor="docFile">Fil *</Label>
          <Input
            id="docFile"
            type="file"
            required
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="cursor-pointer"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            PDF, Word, Excel, bilder osv. Maks 50MB.
          </p>
        </div>
        <Button
          type="submit"
          disabled={uploading || !file || !title.trim()}
          className="bg-hacbc-red hover:bg-hacbc-red/80"
        >
          <Upload className="mr-2 h-4 w-4" />
          {uploading ? "Laster opp..." : "Last opp"}
        </Button>
      </form>

      {/* Document list */}
      <div>
        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
          {documents.length} dokument{documents.length !== 1 ? "er" : ""}
        </h3>
        <div className="space-y-3">
          {documents.length === 0 && (
            <p className="text-muted-foreground">Ingen dokumenter lastet opp ennå.</p>
          )}
          {documents.map((doc) => (
            <Card key={doc.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                      {getFileIcon(doc.mimeType)}
                    </div>
                    <div className="min-w-0">
                      {editingId === doc.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Input
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="h-7 text-sm"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEdit(doc.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                            />
                          </div>
                          <Input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            className="h-7 text-sm"
                            placeholder="Beskrivelse..."
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEdit(doc.id)}
                              className="rounded p-0.5 text-green-400 hover:bg-green-400/10"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="rounded p-0.5 text-muted-foreground hover:bg-muted"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{doc.title}</p>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                          )}
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>{doc.fileName}</span>
                            <span>&middot;</span>
                            <span>{formatFileSize(doc.fileSize)}</span>
                            <span>&middot;</span>
                            <span>
                              {new Date(doc.createdAt).toLocaleDateString("nb-NO")}
                            </span>
                            <span>&middot;</span>
                            <span>{doc.uploadedBy}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 gap-1">
                    <Button variant="outline" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3 w-3" />
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingId(doc.id);
                        setEditTitle(doc.title);
                        setEditDescription(doc.description || "");
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
