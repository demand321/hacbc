"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      // Fetch full profile data
      fetch("/api/medlem/profil")
        .then((res) => res.json())
        .then((data) => {
          if (data.phone) setPhone(data.phone);
          if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        });
    }
  }, [session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/medlem/profil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, avatarUrl }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || "Noe gikk galt");
        return;
      }

      await update({ name });
      setMessage("Profilen er oppdatert!");
    } catch {
      setMessage("Noe gikk galt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
        Rediger <span className="text-hacbc-red">profil</span>
      </h1>

      <Card className="mt-6 border-border">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Navn</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="avatarUrl">Profilbilde (URL)</Label>
              <Input
                id="avatarUrl"
                type="url"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Lim inn en URL til profilbildet ditt. Filopplasting kommer
                senere.
              </p>
            </div>

            {avatarUrl && (
              <div className="flex items-center gap-4">
                <img
                  src={avatarUrl}
                  alt="Forhåndsvisning"
                  className="h-16 w-16 rounded-full border border-border object-cover"
                />
                <span className="text-sm text-muted-foreground">
                  Forhåndsvisning
                </span>
              </div>
            )}

            {message && (
              <p
                className={`text-sm ${
                  message.includes("oppdatert")
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              >
                {message}
              </p>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? "Lagrer..." : "Lagre endringer"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
