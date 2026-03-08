"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Send, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface OtherUser {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export default function MessageThreadPage() {
  const params = useParams();
  const otherUserId = params.conversationId as string;
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/medlem/meldinger?userId=${otherUserId}`
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        if (data.otherUser) setOtherUser(data.otherUser);
      }
    } catch {
      // Ignore polling errors
    } finally {
      setLoading(false);
    }
  }, [otherUserId]);

  useEffect(() => {
    fetchMessages();
    intervalRef.current = setInterval(fetchMessages, 10000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/medlem/meldinger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: otherUserId,
          content: newMessage.trim(),
        }),
      });

      if (res.ok) {
        setNewMessage("");
        await fetchMessages();
      }
    } finally {
      setSending(false);
    }
  }

  const currentUserId = session?.user?.id;

  return (
    <div className="mx-auto flex max-w-3xl flex-col px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link
          href="/medlem/meldinger"
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {otherUser && (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {otherUser.avatarUrl ? (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.name}
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                otherUser.name.charAt(0).toUpperCase()
              )}
            </div>
            <h1 className="text-lg font-semibold">{otherUser.name}</h1>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto py-4" style={{ minHeight: "400px" }}>
        {loading ? (
          <p className="text-center text-muted-foreground">Laster meldinger...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground">
            Ingen meldinger ennå. Send den første!
          </p>
        ) : (
          messages.map((msg) => {
            const isSent = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex ${isSent ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isSent
                      ? "bg-hacbc-red text-white"
                      : "bg-muted text-foreground"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`mt-1 text-xs ${
                      isSent ? "text-white/60" : "text-muted-foreground"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleString("nb-NO", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-border pt-4"
      >
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Skriv en melding..."
          disabled={sending}
          className="flex-1"
        />
        <Button type="submit" disabled={sending || !newMessage.trim()} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
