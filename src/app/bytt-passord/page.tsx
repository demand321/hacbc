"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";

export default function ChangePasswordPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Du må være innlogget.</p>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Passordet må være minst 8 tegn");
      return;
    }
    if (password !== confirm) {
      setError("Passordene stemmer ikke overens");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/bytt-passord", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: password }),
    });

    if (res.ok) {
      // Update the session to clear mustChangePassword
      await update();
      router.push("/medlem");
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Noe gikk galt");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border">
        <CardContent className="p-8">
          <div className="mb-6 text-center">
            <Lock className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase">
              Bytt passord
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Du må velge et nytt passord før du kan fortsette.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Nytt passord (min 8 tegn)</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="confirm">Bekreft passord</Label>
              <Input
                id="confirm"
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-hacbc-red hover:bg-hacbc-red/80"
            >
              {loading ? "Lagrer..." : "Lagre nytt passord"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
