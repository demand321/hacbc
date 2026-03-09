"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Heart, MessageCircle, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import PhotoLightbox, { type LightboxPhoto } from "@/components/PhotoLightbox";

interface Photo extends LightboxPhoto {
  caption: string | null;
}

interface AlbumData {
  id: string;
  title: string;
  photos: Photo[];
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);
}

export default function AlbumPhotosPage({
  params,
}: {
  params: Promise<{ albumId: string }>;
}) {
  const { data: session } = useSession();
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
        <Button variant="ghost" className="mt-4" asChild>
          <Link href="/galleri">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til galleri
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/galleri">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake til galleri
        </Link>
      </Button>

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
            className="group relative aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {isVideoUrl(photo.url) ? (
              <>
                <video
                  src={photo.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-black/60 p-3">
                    <Play className="h-6 w-6 fill-white text-white" />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={photo.url}
                alt={photo.caption || `Bilde ${idx + 1}`}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
            )}
            <div className="absolute bottom-1 left-1 flex gap-1.5">
              {photo.likes.length > 0 && (
                <span className="flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                  {photo.likes.length}
                </span>
              )}
              {photo.comments.length > 0 && (
                <span className="flex items-center gap-0.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
                  <MessageCircle className="h-3 w-3" />
                  {photo.comments.length}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>

      <PhotoLightbox
        photos={album.photos}
        selectedIndex={selectedIndex}
        onClose={() => setSelectedIndex(null)}
        onNavigate={setSelectedIndex}
        photoType={albumId.startsWith("cruising-") ? "cruising" : "gallery"}
        currentUserName={session?.user?.name || null}
        currentUserId={session?.user?.id || null}
        isAdmin={session?.user?.role === "ADMIN"}
        onPhotosChange={(updated) =>
          setAlbum((prev) => (prev ? { ...prev, photos: updated as Photo[] } : prev))
        }
      />
    </div>
  );
}
