"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamicImport from "next/dynamic";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Ruler,
  Calendar,
  Users,
  Send,
  MessageCircle,
  Camera,
  ChevronDown,
  ChevronUp,
  Heart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PhotoLightbox, { type LightboxPhoto } from "@/components/PhotoLightbox";

interface Waypoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sortOrder: number;
  note: string | null;
}

interface RouteData {
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
  route: RouteData | null;
  signups: Signup[];
  photos: EventPhoto[];
}

const CruisingMap = dynamicImport(() => import("../../cruising/CruisingMap"), {
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

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventId, setEventId] = useState("");
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [showStops, setShowStops] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(
    null
  );

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupError, setSignupError] = useState("");
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [mySignupId, setMySignupId] = useState<string | null>(null);

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showChat, setShowChat] = useState(false);

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

  // Check if already signed up
  useEffect(() => {
    if (!event || !eventId) return;
    if (isLoggedIn && session.user?.id) {
      const existing = event.signups.find(
        (s) => s.userId === session.user?.id
      );
      if (existing) {
        setMySignupId(existing.id);
        setSignupSuccess(true);
        setShowChat(true);
        return;
      }
    }
    const saved = localStorage.getItem(`event-signup-${eventId}`);
    if (saved) {
      const exists = event.signups.find((s) => s.id === saved);
      if (exists) {
        setMySignupId(saved);
        setSignupSuccess(true);
        setShowChat(true);
      } else {
        localStorage.removeItem(`event-signup-${eventId}`);
      }
    }
  }, [eventId, event, isLoggedIn, session]);

  // Poll chat messages
  const fetchMessages = useCallback(() => {
    if (!showChat || !eventId) return;
    const after =
      messages.length > 0
        ? messages[messages.length - 1].createdAt
        : undefined;
    const url = after
      ? `/api/arrangementer/${eventId}/chat?after=${encodeURIComponent(after)}`
      : `/api/arrangementer/${eventId}/chat`;

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
  }, [eventId, showChat, messages]);

  useEffect(() => {
    if (!showChat || !eventId) return;
    fetch(`/api/arrangementer/${eventId}/chat`)
      .then((res) => res.json())
      .then((msgs: ChatMessage[]) => setMessages(msgs))
      .catch(() => {});
  }, [eventId, showChat]);

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
      const res = await fetch(`/api/arrangementer/${eventId}/signup`, {
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
      localStorage.setItem(`event-signup-${eventId}`, signup.id);
      setSignupSuccess(true);
      setShowChat(true);
      setEvent((prev) =>
        prev ? { ...prev, signups: [...prev.signups, signup] } : prev
      );
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : "Noe gikk galt");
    }
  };

  const handleUnsignup = async () => {
    try {
      const res = isLoggedIn
        ? await fetch(`/api/arrangementer/${eventId}/signup`, {
            method: "DELETE",
          })
        : await fetch(`/api/arrangementer/${eventId}/signup`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ signupId: mySignupId }),
          });
      if (res.ok) {
        setSignupSuccess(false);
        setShowChat(false);
        setMySignupId(null);
        setMessages([]);
        localStorage.removeItem(`event-signup-${eventId}`);
        setEvent((prev) =>
          prev
            ? {
                ...prev,
                signups: prev.signups.filter((s) => s.id !== mySignupId),
              }
            : prev
        );
      }
    } catch {}
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || !mySignupId) return;
    setSendingChat(true);
    try {
      const res = await fetch(`/api/arrangementer/${eventId}/chat`, {
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

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/arrangementer"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Tilbake til arrangementer
      </Link>

      {/* Hero image */}
      {event.imageUrl && (
        <div className="relative mb-8 aspect-[16/7] w-full overflow-hidden rounded-xl">
          <img
            src={event.imageUrl}
            alt={event.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          {event.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            {formatDate(event.date)} kl. {formatTime(event.date)}
            {event.endDate && (
              <>
                {" "}
                &ndash; {formatDate(event.endDate)} kl.{" "}
                {formatTime(event.endDate)}
              </>
            )}
          </span>
          {event.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {event.location}
              {event.address && (
                <span className="text-muted-foreground/70">
                  ({event.address})
                </span>
              )}
            </span>
          )}
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
          <p className="mt-4 whitespace-pre-line text-muted-foreground">
            {event.description}
          </p>
        )}
      </div>

      {/* Map with route */}
      {event.route && event.route.waypoints.length > 0 && (
        <div className="mb-8">
          <div className="overflow-hidden rounded-xl border border-border">
            <CruisingMap
              waypoints={event.route.waypoints}
              onRouteInfo={setRouteInfo}
              showMarkers={showStops}
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
          <button
            onClick={() => setShowStops((v) => !v)}
            className="mt-4 flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <MapPin className="h-4 w-4" />
            Stoppesteder ({event.route.waypoints.length})
            {showStops ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
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

      {/* Photo gallery */}
      {event.photos.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
            <Camera className="h-5 w-5 text-primary" />
            Bilder ({event.photos.length})
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
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

      {/* Signup + Chat grid */}
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
                      Påmelding som{" "}
                      <span className="font-medium text-foreground">
                        {session.user?.name}
                      </span>
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
                <p className="text-sm text-green-500">Du er påmeldt!</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUnsignup}
                  className="text-destructive hover:text-destructive"
                >
                  Meld av
                </Button>
              </div>
            )}
            {signupSuccess && isPast && (
              <p className="border-t border-border pt-4 text-sm text-green-500">
                Du var påmeldt dette arrangementet.
              </p>
            )}
            {isPast && !signupSuccess && (
              <p className="text-sm text-muted-foreground">
                Dette arrangementet er allerede gjennomført.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Chat section */}
        <Card className="border-border">
          <CardContent className="flex h-full flex-col p-6">
            <h2 className="mb-4 flex items-center gap-2 font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
              <MessageCircle className="h-5 w-5 text-primary" />
              Chat
            </h2>

            {!showChat ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center text-muted-foreground">
                <MessageCircle className="mb-2 h-10 w-10 opacity-40" />
                <p>Meld deg på for å delta i chatten</p>
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
