"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

interface Photo {
  id: string;
  url: string;
  caption: string | null;
}

interface AlbumData {
  id: string;
  title: string;
  photos: Photo[];
}

export default function AlbumPhotosPage({
  params,
}: {
  params: Promise<{ albumId: string }>;
}) {
  const [album, setAlbum] = useState<AlbumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [albumId, setAlbumId] = useState<string>("");

  useEffect(() => {
    params.then((p) => setAlbumId(p.albumId));
  }, [params]);

  useEffect(() => {
    if (!albumId) return;
    fetch(`/api/galleri/${albumId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setAlbum(data))
      .catch(() => setAlbum(null))
      .finally(() => setLoading(false));
  }, [albumId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Laster album...</div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Album ikke funnet</h1>
        <Button variant="ghost" className="mt-4" asChild><Link href="/galleri">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake til galleri
        </Link></Button>
      </div>
    );
  }

  const goToPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < album.photos.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Button variant="ghost" className="mb-6" asChild><Link href="/galleri">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tilbake til galleri
      </Link></Button>

      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight sm:text-4xl">
        {album.title}
      </h1>
      <p className="mt-2 text-muted-foreground">
        {album.photos.length} bilder
      </p>

      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {album.photos.map((photo, idx) => (
          <button
            key={photo.id}
            onClick={() => setSelectedIndex(idx)}
            className="group relative aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-hacbc-red"
          >
            <img
              src={photo.url}
              alt={photo.caption || `Bilde ${idx + 1}`}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      <Dialog
        open={selectedIndex !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedIndex(null);
        }}
      >
        <DialogContent className="max-w-4xl border-none bg-black/95 p-0 sm:max-w-4xl">
          <DialogTitle className="sr-only">
            {selectedIndex !== null
              ? album.photos[selectedIndex]?.caption || `Bilde ${selectedIndex + 1}`
              : "Bilde"}
          </DialogTitle>
          {selectedIndex !== null && album.photos[selectedIndex] && (
            <div className="relative flex items-center justify-center">
              <img
                src={album.photos[selectedIndex].url}
                alt={
                  album.photos[selectedIndex].caption ||
                  `Bilde ${selectedIndex + 1}`
                }
                className="max-h-[80vh] w-auto max-w-full object-contain"
              />
              {selectedIndex > 0 && (
                <button
                  onClick={goToPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}
              {selectedIndex < album.photos.length - 1 && (
                <button
                  onClick={goToNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/80"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
              {album.photos[selectedIndex].caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 text-center text-sm text-white">
                  {album.photos[selectedIndex].caption}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
