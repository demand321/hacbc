"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passordene stemmer ikke overens");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Passordet må være minst 8 tegn");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/registrer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Noe gikk galt");
        setLoading(false);
        return;
      }

      router.push("/registrer/venter");
    } catch {
      setError("Noe gikk galt. Prøv igjen.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardContent className="p-8">
          <h1 className="mb-6 text-center font-[family-name:var(--font-heading)] text-3xl font-bold uppercase">
            Bli <span className="text-hacbc-red">medlem</span>
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="name">Fullt navn</Label>
              <Input id="name" name="name" required className="mt-1" />
            </div>
            <div>
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phone">Telefon (valgfritt)</Label>
              <Input id="phone" name="phone" type="tel" className="mt-1" />
            </div>
            <div>
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Bekreft passord</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="mt-1"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Registrerer..." : "Registrer deg"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Har du allerede en konto?{" "}
            <Link
              href="/logg-inn"
              className="font-medium text-hacbc-red hover:underline"
            >
              Logg inn
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Etter registrering må kontoen godkjennes av en administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
