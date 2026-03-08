"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Heart,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PhotoLightbox, { type LightboxPhoto } from "@/components/PhotoLightbox";

interface EventPhoto extends LightboxPhoto {
  albumTitle?: string;
}

interface EventData {
  id: string;
  title: string;
  description: string | null;
  date: string;
  endDate: string | null;
  location: string | null;
  address: string | null;
  imageUrl: string | null;
  photos: EventPhoto[];
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = useSession();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );

  useEffect(() => {
    params.then((p) => setEventId(p.id));
  }, [params]);

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/arrangementer/${eventId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => setEvent(data))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Laster arrangement...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Arrangement ikke funnet</h1>
        <Button variant="ghost" className="mt-4" asChild>
          <Link href="/arrangementer">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tilbake til arrangementer
          </Link>
        </Button>
      </div>
    );
  }

  const date = new Date(event.date);
  const dateStr = date.toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = date.toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const endDate = event.endDate ? new Date(event.endDate) : null;
  const endDateStr = endDate
    ? endDate.toLocaleDateString("nb-NO", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const endTimeStr = endDate
    ? endDate.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/arrangementer">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake til arrangementer
        </Link>
      </Button>

      {event.imageUrl && (
        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-xl">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="mt-8">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          {event.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-hacbc-red" />
            <span>
              {dateStr} kl. {timeStr}
              {endDateStr && endTimeStr && (
                <>
                  {" "}
                  &ndash; {endDateStr} kl. {endTimeStr}
                </>
              )}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-hacbc-red" />
              <span>{event.location}</span>
              {event.address && (
                <span className="text-muted-foreground/70">
                  ({event.address})
                </span>
              )}
            </div>
          )}
        </div>

        {event.description && (
          <div className="mt-8">
            <p className="whitespace-pre-line text-muted-foreground">
              {event.description}
            </p>
          </div>
        )}

        {/* Photo gallery */}
        {event.photos.length > 0 && (
          <div className="mt-10">
            <h2 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
              Bilder ({event.photos.length})
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {event.photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className="group relative aspect-square overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || `Bilde ${idx + 1}`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
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
          </div>
        )}
      </div>

      <PhotoLightbox
        photos={event.photos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(null)}
        onNavigate={setSelectedPhotoIndex}
        photoType="gallery"
        currentUserName={session?.user?.name || null}
        currentUserId={session?.user?.id || null}
        isAdmin={session?.user?.role === "ADMIN"}
        onPhotosChange={(updated) =>
          setEvent((prev) =>
            prev ? { ...prev, photos: updated as EventPhoto[] } : prev
          )
        }
      />
    </div>
  );
}
