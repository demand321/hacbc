"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/medlem";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    if (result?.error) {
      setError("Feil e-post eller passord");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardContent className="p-8">
          <h1 className="mb-6 text-center font-[family-name:var(--font-heading)] text-3xl font-bold uppercase">
            Logg <span className="text-hacbc-red">inn</span>
          </h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={loading} className="mt-2">
              {loading ? "Logger inn..." : "Logg inn"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ikke medlem ennå?{" "}
            <Link
              href="/registrer"
              className="font-medium text-hacbc-red hover:underline"
            >
              Registrer deg
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
