"use client";

import { useState } from "react";
import { Heart, MessageCircle, Send, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

export interface LightboxPhoto {
  id: string;
  url: string;
  comment?: string | null;
  caption?: string | null;
  uploaderName?: string | null;
  uploadedById?: string | null;
  uploadedBy?: { name: string } | null;
  likes: PhotoLike[];
  comments: PhotoComment[];
}

interface PhotoLightboxProps {
  photos: LightboxPhoto[];
  selectedIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  photoType: "cruising" | "gallery";
  currentUserName?: string | null;
  currentUserId?: string | null;
  isAdmin?: boolean;
  onPhotosChange?: (photos: LightboxPhoto[]) => void;
}

export default function PhotoLightbox({
  photos,
  selectedIndex,
  onClose,
  onNavigate,
  photoType,
  currentUserName,
  currentUserId,
  isAdmin = false,
  onPhotosChange,
}: PhotoLightboxProps) {
  const [commentInput, setCommentInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [sending, setSending] = useState(false);
  const [liking, setLiking] = useState(false);

  function isVideoUrl(url: string) {
    return /\.(mp4|mov|webm|avi|mkv)(\?|$)/i.test(url);
  }

  if (selectedIndex === null || !photos[selectedIndex]) return null;

  const photo = photos[selectedIndex];
  const isVideo = isVideoUrl(photo.url);
  const label = photo.comment || photo.caption || "Bilde";
  const uploader = photo.uploadedBy?.name || photo.uploaderName;

  const userHasLiked = currentUserId
    ? photo.likes.some((l) => l.userId === currentUserId)
    : false;

  const canDelete = isAdmin || (currentUserId && photo.uploadedById === currentUserId);

  const handleDelete = async () => {
    if (!confirm(isVideo ? "Slette denne videoen?" : "Slette dette bildet?")) return;
    try {
      const res = await fetch(`/api/photos/${photo.id}?type=${photoType}`, {
        method: "DELETE",
      });
      if (res.ok) {
        const updated = photos.filter((_, i) => i !== selectedIndex);
        onPhotosChange?.(updated);
        if (updated.length === 0) {
          onClose();
        } else {
          onNavigate(Math.min(selectedIndex, updated.length - 1));
        }
      }
    } catch {}
  };

  const handleLike = async () => {
    const authorName = currentUserName || nameInput.trim();
    if (!authorName) return;
    setLiking(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, type: photoType }),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = [...photos];
        if (data.unliked) {
          updated[selectedIndex] = {
            ...photo,
            likes: photo.likes.filter(
              (l) => !(currentUserId && l.userId === currentUserId)
            ),
          };
        } else {
          updated[selectedIndex] = {
            ...photo,
            likes: [...photo.likes, data],
          };
        }
        onPhotosChange?.(updated);
      }
    } catch {
      // ignore
    } finally {
      setLiking(false);
    }
  };

  const handleComment = async () => {
    const authorName = currentUserName || nameInput.trim();
    if (!commentInput.trim() || !authorName) return;
    setSending(true);
    try {
      const res = await fetch(`/api/photos/${photo.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentInput.trim(),
          authorName,
          type: photoType,
        }),
      });
      if (res.ok) {
        const comment = await res.json();
        const updated = [...photos];
        updated[selectedIndex] = {
          ...photo,
          comments: [...photo.comments, comment],
        };
        onPhotosChange?.(updated);
        setCommentInput("");
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg bg-card lg:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image / Video */}
        <div className="relative flex min-h-[300px] flex-1 items-center justify-center bg-black">
          {isVideo ? (
            <video
              src={photo.url}
              controls
              autoPlay
              playsInline
              className="max-h-[60vh] w-auto max-w-full object-contain lg:max-h-[90vh]"
            />
          ) : (
            <img
              src={photo.url}
              alt={label}
              className="max-h-[60vh] w-auto max-w-full object-contain lg:max-h-[90vh]"
            />
          )}
          {selectedIndex > 0 && (
            <button
              onClick={() => onNavigate(selectedIndex - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/80"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          {selectedIndex < photos.length - 1 && (
            <button
              onClick={() => onNavigate(selectedIndex + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/80"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>

        {/* Sidebar with likes + comments */}
        <div className="flex w-full flex-col border-t border-border lg:w-80 lg:border-l lg:border-t-0">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="min-w-0">
              {uploader && (
                <p className="text-sm font-medium">{uploader}</p>
              )}
              {(photo.comment || photo.caption) && (
                <p className="truncate text-sm text-muted-foreground">
                  {photo.comment || photo.caption}
                </p>
              )}
            </div>
            <div className="ml-2 flex items-center gap-1">
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="text-muted-foreground hover:text-red-500"
                  title="Slett bilde"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Like bar */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-2">
            <button
              onClick={handleLike}
              disabled={liking || (!currentUserName && !nameInput.trim())}
              className="flex items-center gap-1.5 text-sm transition-colors hover:text-primary"
            >
              <Heart
                className={`h-5 w-5 ${userHasLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span className="font-medium">{photo.likes.length}</span>
            </button>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MessageCircle className="h-5 w-5" />
              <span>{photo.comments.length}</span>
            </div>
            {photo.likes.length > 0 && (
              <p className="ml-auto truncate text-xs text-muted-foreground">
                {photo.likes.map((l) => l.authorName).join(", ")}
              </p>
            )}
          </div>

          {/* Comments list */}
          <div className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: 300 }}>
            {photo.comments.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Ingen kommentarer ennå
              </p>
            )}
            {photo.comments.map((c) => (
              <div key={c.id} className="text-sm">
                <span className="font-medium">{c.authorName}</span>{" "}
                <span className="text-muted-foreground">{c.content}</span>
                <p className="text-xs text-muted-foreground/60">
                  {new Date(c.createdAt).toLocaleDateString("nb-NO", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>

          {/* Comment input */}
          <div className="border-t border-border p-3">
            {!currentUserName && (
              <Input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ditt navn"
                className="mb-2"
              />
            )}
            <div className="flex gap-2">
              <Input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Skriv en kommentar..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleComment();
                  }
                }}
              />
              <Button
                size="icon"
                onClick={handleComment}
                disabled={sending || !commentInput.trim() || (!currentUserName && !nameInput.trim())}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
