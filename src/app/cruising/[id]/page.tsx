"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  MapPin,
  Clock,
  Ruler,
  Calendar,
  Users,
  Send,
  ArrowLeft,
  MessageCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  Heart,
  ImagePlus,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhotoLightbox from "@/components/PhotoLightbox";

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sortOrder: number;
  note: string | null;
}

interface CruisingRoute {
  id: string;
  title: string;
  description: string | null;
  waypoints: Waypoint[];
}

interface Signup {
  id: string;
  name: string;
  userId: string | null;
  createdAt: string;
}

interface ChatMessage {
  id: string;
  signupId: string;
  content: string;
  createdAt: string;
  signup: { name: string };
}

interface PhotoComment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
}

interface PhotoLike {
  id: string;
  authorName: string;
  userId: string | null;
}

interface CruisingPhoto {
  id: string;
  url: string;
  comment: string | null;
  lat?: number | null;
  lng?: number | null;
  uploaderName?: string | null;
  uploadedBy?: { name: string } | null;
  likes: PhotoLike[];
  comments: PhotoComment[];
}

interface CruisingEventDetail {
  id: string;
  date: string;
  title: string;
  description: string | null;
  route: CruisingRoute | null;
  signups: Signup[];
  photos: CruisingPhoto[];
}

const CruisingMap = dynamic(() => import("../CruisingMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[400px] items-center justify-center rounded-xl bg-muted">
      <div className="text-muted-foreground">Laster kart...</div>
    </div>
  ),
});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("nb-NO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CruisingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [event, setEvent] = useState<CruisingEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [showStops, setShowStops] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [mySignupId, setMySignupId] = useState<string | null>(null);

  // Photo upload state
  const [uploading, setUploading] = useState(false);
  const [uploadComment, setUploadComment] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    fetch(`/api/cruising/${id}`)
      .then((res) => res.json())
      .then((d) => setEvent(d))
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [id]);

  // Check if already signed up (logged-in user or localStorage for guests)
  useEffect(() => {
    if (!event) return;
    if (isLoggedIn && session.user?.id) {
      const existing = event.signups.find((s) => s.userId === session.user?.id);
      if (existing) {
        setMySignupId(existing.id);
        setSignupSuccess(true);
        setShowChat(true);
        return;
      }
    }
    const saved = localStorage.getItem(`cruising-signup-${id}`);
    if (saved) {
      // Verify it's still valid
      const exists = event.signups.find((s) => s.id === saved);
      if (exists) {
        setMySignupId(saved);
        setSignupSuccess(true);
        setShowChat(true);
      } else {
        localStorage.removeItem(`cruising-signup-${id}`);
      }
    }
  }, [id, event, isLoggedIn, session]);

  // Poll chat messages
  const fetchMessages = useCallback(() => {
    if (!showChat) return;
    const after =
      messages.length > 0
        ? messages[messages.length - 1].createdAt
        : undefined;
    const url = after
      ? `/api/cruising/${id}/chat?after=${encodeURIComponent(after)}`
      : `/api/cruising/${id}/chat`;

    fetch(url)
      .then((res) => res.json())
      .then((newMsgs: ChatMessage[]) => {
        if (newMsgs.length > 0) {
          setMessages((prev) => {
            const ids = new Set(prev.map((m) => m.id));
            const unique = newMsgs.filter((m) => !ids.has(m.id));
            return [...prev, ...unique];
          });
        }
      })
      .catch(() => {});
  }, [id, showChat, messages]);

  useEffect(() => {
    if (!showChat) return;
    fetch(`/api/cruising/${id}/chat`)
      .then((res) => res.json())
      .then((msgs: ChatMessage[]) => setMessages(msgs))
      .catch(() => {});
  }, [id, showChat]);

  useEffect(() => {
    if (!showChat) return;
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [showChat, fetchMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSignup = async () => {
    if (!isLoggedIn && !signupName.trim()) {
      setSignupError("Navn er påkrevd");
      return;
    }
    setSignupError("");
    try {
      const res = await fetch(`/api/cruising/${id}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isLoggedIn
            ? {}
            : { name: signupName.trim(), phone: signupPhone.trim() }
        ),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Noe gikk galt");
      }
      const signup = await res.json();
      setMySignupId(signup.id);
      localStorage.setItem(`cruising-signup-${id}`, signup.id);
      setSignupSuccess(true);
      setShowChat(true);
      setEvent((prev) =>
        prev ? { ...prev, signups: [...prev.signups, signup] } : prev
      );
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : "Noe gikk galt");
    }
  };

  const handleUploadPhoto = async (file: File) => {
    if (!signupSuccess) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (mySignupId) form.append("signupId", mySignupId);
      if (uploadComment.trim()) form.append("comment", uploadComment.trim());

      const res = await fetch(`/api/cruising/${id}/photos`, {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        const photo = await res.json();
        photo.likes = photo.likes || [];
        photo.comments = photo.comments || [];
        setEvent((prev) =>
          prev ? { ...prev, photos: [...prev.photos, photo] } : prev
        );
        setUploadComment("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Opplasting feilet");
      }
    } catch {
      // ignore
    } finally {
      setUploading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !mySignupId) return;
    setSendingChat(true);
    try {
      const res = await fetch(`/api/cruising/${id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signupId: mySignupId,
          content: chatInput.trim(),
        }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setChatInput("");
      }
    } catch {
      // ignore
    } finally {
      setSendingChat(false);
    }
  };

  const isPast = event ? new Date(event.date) < new Date() : false;

  // Build photo markers for map (only photos with geo data)
  const photoMarkers =
    event?.photos
      ?.filter((p) => p.lat != null && p.lng != null)
      .map((p) => ({
        id: p.id,
        url: p.url,
        comment: p.comment,
        lat: p.lat!,
        lng: p.lng!,
      })) ?? [];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted-foreground">Laster...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Turen ble ikke funnet</h1>
        <Link href="/cruising" className="mt-4 text-primary hover:underline">
          Tilbake til cruising
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/cruising"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Tilbake til cruising
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          {event.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            {formatDate(event.date)} kl. {formatTime(event.date)}
          </span>
          {event.route && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              Rute: {event.route.title}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-primary" />
            {event.signups.length} påmeldt
          </span>
        </div>
        {event.description && (
          <p className="mt-4 text-muted-foreground">{event.description}</p>
        )}
      </div>

      {/* Map - route only, no waypoint markers by default */}
      {event.route && event.route.waypoints.length > 0 && (
        <div className="mb-8">
          <div className="overflow-hidden rounded-xl border border-border">
            <CruisingMap
              waypoints={event.route.waypoints}
              onRouteInfo={setRouteInfo}
              showMarkers={showStops}
              photoMarkers={photoMarkers}
            />
          </div>
          {routeInfo && (
            <div className="mt-2 flex flex-wrap gap-4">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Ruler className="h-4 w-4 text-primary" />
                {routeInfo.distance}
              </span>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                ca. {routeInfo.duration} kjøretid
              </span>
            </div>
          )}

          {/* Collapsible waypoints */}
          <button
            onClick={() => setShowStops((v) => !v)}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <MapPin className="h-4 w-4" />
            Stoppesteder ({event.route.waypoints.length})
            {showStops ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showStops && (
            <div className="mt-3 space-y-2">
              {event.route.waypoints.map((wp, idx) => (
                <div
                  key={wp.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="font-medium">{wp.name}</p>
                    {wp.note && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {wp.note}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Photo gallery + upload */}
      {(event.photos.length > 0 || signupSuccess) && (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
            <Camera className="h-5 w-5 text-primary" />
            Bilder
            {event.photos.length > 0 && (
              <span className="text-base font-normal text-muted-foreground">
                ({event.photos.length})
              </span>
            )}
          </h2>

          {/* Upload area for participants */}
          {signupSuccess && (
            <div className="mb-4 rounded-lg border border-dashed border-border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <Label htmlFor="photo-comment" className="mb-1 text-sm">Kommentar (valgfritt)</Label>
                  <Input
                    id="photo-comment"
                    value={uploadComment}
                    onChange={(e) => setUploadComment(e.target.value)}
                    placeholder="Beskriv bildet..."
                  />
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadPhoto(file);
                    }}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    variant="outline"
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {uploading ? "Laster opp..." : "Last opp bilde"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {event.photos.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {event.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group cursor-pointer"
                  onClick={() => setSelectedPhotoIndex(event.photos.indexOf(photo))}
                >
                  <div className="relative overflow-hidden rounded-lg border border-border">
                    <img
                      src={photo.url}
                      alt={photo.comment || "Cruising-bilde"}
                      className="aspect-square w-full object-cover transition-transform group-hover:scale-105"
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
                    {photo.lat != null && photo.lng != null && (
                      <div className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5">
                        <MapPin className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : signupSuccess ? (
            <p className="text-sm text-muted-foreground">
              Ingen bilder ennå. Vær den første til å dele!
            </p>
          ) : null}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Signup section */}
        <Card className="border-border">
          <CardContent className="p-6">
            <h2 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
              <Users className="h-5 w-5 text-primary" />
              Påmelding
              <span className="ml-auto text-base font-normal text-muted-foreground">
                {event.signups.length} stk
              </span>
            </h2>

            {event.signups.length > 0 && (
              <div className="mb-4 space-y-1">
                {event.signups.map((s, i) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2 rounded px-2 py-1.5 text-sm odd:bg-muted/50"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
            )}

            {!isPast && !signupSuccess && (
              <div className="space-y-3 border-t border-border pt-4">
                {isLoggedIn ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Påmelding som <span className="font-medium text-foreground">{session.user?.name}</span>
                    </p>
                    {signupError && (
                      <p className="text-sm text-destructive">{signupError}</p>
                    )}
                    <Button onClick={handleSignup} className="w-full">
                      Meld meg på
                    </Button>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="signup-name">Navn *</Label>
                      <Input
                        id="signup-name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="Ditt navn"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-phone">Telefon (valgfritt)</Label>
                      <Input
                        id="signup-phone"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="Mobilnummer"
                      />
                    </div>
                    {signupError && (
                      <p className="text-sm text-destructive">{signupError}</p>
                    )}
                    <Button onClick={handleSignup} className="w-full">
                      Meld meg på
                    </Button>
                  </>
                )}
              </div>
            )}
            {signupSuccess && !isPast && (
              <div className="flex items-center justify-between border-t border-border pt-4">
                <p className="text-sm text-green-500">
                  Du er påmeldt!
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = isLoggedIn
                        ? await fetch(`/api/cruising/${id}/signup`, { method: "DELETE" })
                        : await fetch(`/api/cruising/${id}/signup`, {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ signupId: mySignupId }),
                          });
                      if (res.ok) {
                        setSignupSuccess(false);
                        setShowChat(false);
                        setMySignupId(null);
                        setMessages([]);
                        localStorage.removeItem(`cruising-signup-${id}`);
                        setEvent((prev) =>
                          prev
                            ? { ...prev, signups: prev.signups.filter((s) => s.id !== mySignupId) }
                            : prev
                        );
                      }
                    } catch {}
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  Meld av
                </Button>
              </div>
            )}
            {signupSuccess && isPast && (
              <p className="border-t border-border pt-4 text-sm text-green-500">
                Du var påmeldt denne turen.
              </p>
            )}
            {isPast && !signupSuccess && (
              <p className="text-sm text-muted-foreground">
                Denne turen er allerede gjennomført.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Chat section */}
        <Card className="border-border">
          <CardContent className="flex h-full flex-col p-6">
            <h2 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
              <MessageCircle className="h-5 w-5 text-primary" />
              Tur-chat
            </h2>

            {!showChat ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
                <MessageCircle className="mb-2 h-10 w-10 opacity-40" />
                <p>Meld deg på turen for å delta i chatten</p>
              </div>
            ) : (
              <>
                <div
                  className="flex-1 space-y-3 overflow-y-auto rounded-lg bg-muted/30 p-3"
                  style={{ maxHeight: 400, minHeight: 200 }}
                >
                  {messages.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      Ingen meldinger ennå. Si hei!
                    </p>
                  )}
                  {messages.map((msg) => {
                    const isMe = mySignupId === msg.signupId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        <span className="mb-0.5 text-xs text-muted-foreground">
                          {msg.signup.name}
                        </span>
                        <div
                          className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                            isMe
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="mt-0.5 text-xs text-muted-foreground/60">
                          {new Date(msg.createdAt).toLocaleTimeString("nb-NO", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                  <div ref={chatEndRef} />
                </div>
                <div className="mt-3 flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Skriv en melding..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendChat}
                    disabled={sendingChat || !chatInput.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <PhotoLightbox
        photos={event.photos}
        selectedIndex={selectedPhotoIndex}
        onClose={() => setSelectedPhotoIndex(null)}
        onNavigate={setSelectedPhotoIndex}
        photoType="cruising"
        currentUserName={session?.user?.name || null}
        currentUserId={session?.user?.id || null}
        onPhotosChange={(updated) =>
          setEvent((prev) => (prev ? { ...prev, photos: updated as CruisingPhoto[] } : prev))
        }
      />
    </div>
  );
}
