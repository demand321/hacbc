"use client";

import Link from "next/link";
import Image from "next/image";
import { Calendar, Car, Camera, MapPin, ArrowRight, Zap, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { ThemeId } from "@/lib/themes";
import type { LucideIcon } from "lucide-react";
import { useRef } from "react";
import { useSession } from "next-auth/react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}

const features: Feature[] = [
  {
    icon: Car,
    title: "Kjøretøy",
    description: "Se medlemmenes amerikanske biler og motorsykler",
    href: "/kjoretoy",
  },
  {
    icon: Calendar,
    title: "Arrangementer",
    description: "Treff, cruising og klubbkvelder",
    href: "/arrangementer",
  },
  {
    icon: Camera,
    title: "Galleri",
    description: "Bilder fra treff og arrangementer",
    href: "/galleri",
  },
  {
    icon: MapPin,
    title: "Cruising",
    description: "Se ruter og bilder fra cruising",
    href: "/cruising",
  },
];

interface UpcomingEvent {
  id: string;
  title: string;
  date: string;
  location: string | null;
  type: "event" | "cruising";
}

interface ThemedHomeProps {
  upcomingEvents: UpcomingEvent[];
}

function JoinButton({ size = "default", variant = "default", label = "Bli medlem" }: { size?: "lg" | "default"; variant?: "default" | "outline"; label?: string }) {
  const { data: session } = useSession();
  if (session) return null;
  return (
    <Button asChild size={size} variant={variant}>
      <Link href="/registrer">{label}</Link>
    </Button>
  );
}

// ==============================================
// GARAGE LAYOUT - Industrial, raw, functional
// ==============================================
function GarageLayout({ upcomingEvents }: ThemedHomeProps) {
  return (
    <div>
      {/* Hero */}
      <section className="hero-section relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo.png"
              alt="HACBC Logo"
              width={120}
              height={120}
              className="rounded-lg opacity-90"
              priority
            />
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-5xl font-[var(--heading-weight)] uppercase tracking-tight sm:text-7xl">
            Hamar American
            <br />
            <span className="text-gradient">Car &amp; Bike Club</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            For entusiaster av amerikanske biler og motorsykler i
            Hamar-regionen. Bli med på treff, cruising og sosialt samvær.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <JoinButton size="lg" />
            <Button asChild variant="outline" size="lg">
              <Link href="/arrangementer">Se arrangementer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Next Event Banner */}
      <NextEventBanner upcomingEvents={upcomingEvents} />

      {/* Upcoming Events */}
      <UpcomingEventsList upcomingEvents={upcomingEvents} />

      {/* Features - 4 column grid */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className="feature-card group h-full border-border bg-card transition-all duration-300 hover:border-[var(--card-hover-border)]">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <feature.icon className="mb-4 h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
      <AboutSection />
    </div>
  );
}

// ==============================================
// ROUTE 66 LAYOUT - Retro roadside, signpost feel
// ==============================================
function Route66Layout({ upcomingEvents }: ThemedHomeProps) {
  return (
    <div>
      {/* Hero - Full width, tilted signpost feel */}
      <section className="hero-section relative min-h-[80vh] overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        {/* Decorative road lines */}
        <div
          className="absolute bottom-0 left-0 right-0 h-2"
          style={{ background: "linear-gradient(90deg, transparent 0%, var(--accent-color) 20%, var(--accent-secondary) 80%, transparent 100%)" }}
        />
        <div className="relative z-10 mx-auto flex min-h-[80vh] max-w-7xl items-center px-6">
          <div className="grid w-full gap-12 md:grid-cols-5">
            {/* Left: signpost style text */}
            <div className="flex flex-col justify-center md:col-span-3">
              <div
                className="mb-6 inline-block w-fit -rotate-2 border-4 px-6 py-2"
                style={{ borderColor: "var(--accent-color)", background: "rgba(234, 88, 12, 0.1)" }}
              >
                <span className="font-[family-name:var(--font-heading)] text-sm font-bold uppercase tracking-[0.3em]" style={{ color: "var(--accent-color)" }}>
                  Hamar-regionen
                </span>
              </div>
              <h1 className="font-[family-name:var(--font-heading)] text-6xl font-[var(--heading-weight)] uppercase leading-[0.9] tracking-tight sm:text-8xl">
                Hamar
                <br />
                American
                <br />
                <span className="text-gradient">Car &amp; Bike</span>
                <br />
                Club
              </h1>
              <p className="mt-8 max-w-lg text-lg text-muted-foreground">
                For entusiaster av amerikanske biler og motorsykler.
                Bli med på treff, cruising og sosialt samvær.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <JoinButton size="lg" />
                <Button asChild variant="outline" size="lg">
                  <Link href="/arrangementer">Se arrangementer</Link>
                </Button>
              </div>
            </div>
            {/* Right: logo with vintage frame */}
            <div className="flex items-center justify-center md:col-span-2">
              <div
                className="relative flex h-64 w-64 items-center justify-center rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(234, 88, 12, 0.15) 0%, transparent 70%)",
                  border: "3px solid rgba(234, 88, 12, 0.2)",
                }}
              >
                <Image
                  src="/logo.png"
                  alt="HACBC Logo"
                  width={160}
                  height={160}
                  className="rounded-lg opacity-90"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Next Event - retro ticket style */}
      {upcomingEvents[0] && (
        <section className="border-y-2 border-border" style={{ borderColor: "rgba(234, 88, 12, 0.2)" }}>
          <div className="mx-auto max-w-7xl px-6 py-8">
            <Link href={eventHref(upcomingEvents[0])} className="group flex items-center gap-8">
              <div
                className="flex h-20 w-20 flex-shrink-0 flex-col items-center justify-center rounded-xl"
                style={{ background: "var(--accent-color)", color: "white" }}
              >
                <span className="text-xs font-bold uppercase leading-none">
                  {new Date(upcomingEvents[0].date).toLocaleDateString("nb-NO", { month: "short" })}
                </span>
                <span className="text-3xl font-bold leading-none">
                  {new Date(upcomingEvents[0].date).getDate()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Neste {eventLabel(upcomingEvents[0]).toLowerCase()}
                </p>
                <h3 className="mt-1 text-2xl font-bold">{upcomingEvents[0].title}</h3>
                {upcomingEvents[0].location && (
                  <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {upcomingEvents[0].location}
                  </p>
                )}
              </div>
              <ArrowRight className="h-6 w-6 text-muted-foreground transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <UpcomingEventsList upcomingEvents={upcomingEvents} />

      {/* Features - 2 column with large icons on left */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="mb-12 font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
          Utforsk <span className="text-gradient">klubben</span>
        </h2>
        <div className="grid gap-8 sm:grid-cols-2">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href} className="group">
              <div className="flex items-start gap-6 rounded-xl border border-border bg-card/50 p-6 transition-all duration-300 hover:border-[var(--card-hover-border)] hover:bg-card">
                <div
                  className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: "rgba(234, 88, 12, 0.1)", border: "1px solid rgba(234, 88, 12, 0.2)" }}
                >
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Les mer <ChevronRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Vintage horizontal divider */}
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-6">
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, var(--accent-color))" }} />
        <div className="h-3 w-3 rotate-45" style={{ background: "var(--accent-color)" }} />
        <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, var(--accent-color), transparent)" }} />
      </div>

      {/* About */}
      <AboutSection />
    </div>
  );
}

// ==============================================
// CHROME LAYOUT - Premium showroom, glass-morphism
// ==============================================
function ChromeLayout({ upcomingEvents }: ThemedHomeProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      {/* Hero - Minimal with lots of whitespace */}
      <section className="hero-section relative flex min-h-[85vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        {/* Subtle radial glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(212, 175, 55, 0.06) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
          <Image
            src="/logo.png"
            alt="HACBC Logo"
            width={90}
            height={90}
            className="mx-auto mb-10 opacity-80"
            priority
          />
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.5em] text-muted-foreground">
            Hamar, Norge
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-5xl font-[var(--heading-weight)] tracking-tight sm:text-7xl">
            <span className="text-gradient">Hamar American</span>
            <br />
            Car &amp; Bike Club
          </h1>
          <p className="mx-auto mt-10 max-w-md text-base text-muted-foreground">
            For entusiaster av amerikanske biler og motorsykler i
            Hamar-regionen.
          </p>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6">
            <JoinButton size="lg" />
            <Button asChild variant="outline" size="lg">
              <Link href="/arrangementer">Arrangementer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Next Event - elegant thin banner */}
      {upcomingEvents[0] && (
        <section
          className="border-y"
          style={{ borderColor: "rgba(212, 175, 55, 0.1)" }}
        >
          <div className="mx-auto max-w-5xl px-4 py-5">
            <Link
              href={eventHref(upcomingEvents[0])}
              className="group flex items-center justify-center gap-6 text-sm"
            >
              <span className="uppercase tracking-[0.3em] text-muted-foreground">Neste</span>
              <span className="h-4 w-px bg-border" />
              <span className="font-medium">{upcomingEvents[0].title}</span>
              <span className="h-4 w-px bg-border" />
              <span className="text-muted-foreground">
                {new Date(upcomingEvents[0].date).toLocaleDateString("nb-NO", { day: "numeric", month: "long" })}
              </span>
              {upcomingEvents[0].location && (
                <>
                  <span className="h-4 w-px bg-border" />
                  <span className="text-muted-foreground">{upcomingEvents[0].location}</span>
                </>
              )}
              <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <UpcomingEventsList upcomingEvents={upcomingEvents} />

      {/* Features - Horizontal scrolling glass panels */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4">
          <p className="mb-12 text-center text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground">
            Utforsk
          </p>
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group flex-shrink-0"
                style={{ scrollSnapAlign: "start" }}
              >
                <div
                  className="flex h-72 w-72 flex-col justify-between rounded-2xl border p-8 transition-all duration-500 hover:scale-[1.02]"
                  style={{
                    borderColor: "rgba(212, 175, 55, 0.08)",
                    background: "rgba(14, 14, 14, 0.6)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <feature.icon className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-2 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Elegant divider */}
      <div className="mx-auto max-w-xs">
        <div className="h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent)" }} />
      </div>

      {/* About - premium layout */}
      <section className="mx-auto max-w-5xl px-4 py-24">
        <div className="text-center">
          <h2 className="font-[family-name:var(--font-heading)] text-3xl font-[var(--heading-weight)] tracking-tight">
            Om <span className="text-gradient">klubben</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-muted-foreground">
            HACBC er en klubb for alle som deler lidenskapen for amerikanske
            biler og motorsykler. Vi holder til på Vandrerhjemmet i Hamar og
            arrangerer regelmessige treff, cruising og sosiale samlinger.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            I sommersesongen arrangerer vi cruising der vi kjører sammen
            gjennom vakre omgivelser i Hamar-regionen.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button asChild variant="outline">
              <Link href="/cruising">Se cruising-ruter</Link>
            </Button>
            <JoinButton label="Registrer deg" />
          </div>
        </div>
      </section>
    </div>
  );
}

// ==============================================
// MIDNIGHT LAYOUT - Cyberpunk, asymmetric, neon
// ==============================================
function MidnightLayout({ upcomingEvents }: ThemedHomeProps) {
  return (
    <div>
      {/* Hero - Asymmetric: text left, neon glow right */}
      <section className="hero-section relative min-h-[90vh] overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        {/* Neon glow orbs */}
        <div
          className="pointer-events-none absolute right-0 top-1/4 h-[600px] w-[600px] translate-x-1/4 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, rgba(217, 70, 239, 0.3) 0%, rgba(6, 182, 212, 0.1) 40%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-1/4 h-[300px] w-[300px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, transparent 70%)" }}
        />
        <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-7xl items-center px-6">
          <div className="max-w-2xl">
            {/* Neon tag */}
            <div
              className="mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em]"
              style={{
                borderColor: "rgba(217, 70, 239, 0.3)",
                background: "rgba(217, 70, 239, 0.05)",
                color: "#d946ef",
                boxShadow: "0 0 20px rgba(217, 70, 239, 0.1)",
              }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#d946ef", boxShadow: "0 0 6px #d946ef" }} />
              Hamar-regionen
            </div>
            <h1 className="font-[family-name:var(--font-heading)] text-6xl font-[var(--heading-weight)] uppercase leading-[1.05] tracking-tight sm:text-8xl">
              Hamar
              <br />
              American
              <br />
              <span className="text-gradient">Car &amp; Bike</span>
              <br />
              Club
            </h1>
            <p className="mt-8 max-w-md text-lg text-muted-foreground">
              For entusiaster av amerikanske biler og motorsykler.
              Bli med på treff, cruising og sosialt samvær.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <JoinButton size="lg" />
              <Button asChild variant="outline" size="lg">
                <Link href="/arrangementer">Se arrangementer</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Bottom neon line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent 10%, #d946ef 40%, #06b6d4 60%, transparent 90%)" }}
        />
      </section>

      {/* Next Event - neon card */}
      {upcomingEvents[0] && (
        <section className="mx-auto max-w-7xl px-6 py-8">
          <Link
            href={eventHref(upcomingEvents[0])}
            className="group flex items-center gap-6 rounded-xl border p-6 transition-all duration-300"
            style={{
              borderColor: "rgba(217, 70, 239, 0.15)",
              background: "rgba(18, 0, 31, 0.6)",
              boxShadow: "0 0 30px rgba(217, 70, 239, 0.05)",
            }}
          >
            <div
              className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center rounded-lg"
              style={{
                background: "rgba(217, 70, 239, 0.15)",
                border: "1px solid rgba(217, 70, 239, 0.3)",
                boxShadow: "0 0 15px rgba(217, 70, 239, 0.1)",
              }}
            >
              <span className="text-[10px] font-bold uppercase leading-none text-primary">
                {new Date(upcomingEvents[0].date).toLocaleDateString("nb-NO", { month: "short" })}
              </span>
              <span className="text-2xl font-bold leading-none text-primary">
                {new Date(upcomingEvents[0].date).getDate()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Neste {eventLabel(upcomingEvents[0]).toLowerCase()}</p>
              <h3 className="mt-1 text-lg font-bold">{upcomingEvents[0].title}</h3>
              {upcomingEvents[0].location && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {upcomingEvents[0].location}
                </p>
              )}
            </div>
            <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-2" />
          </Link>
        </section>
      )}

      {/* Upcoming Events */}
      <UpcomingEventsList upcomingEvents={upcomingEvents} />

      {/* Features - Stacked cards with neon left-border accent */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-4">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href} className="group">
              <div
                className="relative flex items-center gap-6 overflow-hidden rounded-lg border p-6 transition-all duration-300"
                style={{
                  borderColor: "rgba(217, 70, 239, 0.08)",
                  background: "rgba(18, 0, 31, 0.3)",
                }}
              >
                {/* Neon left border */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 group-hover:w-1.5"
                  style={{
                    background: "linear-gradient(180deg, #d946ef, #06b6d4)",
                    boxShadow: "0 0 10px rgba(217, 70, 239, 0.3)",
                    opacity: 0.5,
                  }}
                />
                <feature.icon className="h-8 w-8 flex-shrink-0 text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-all group-hover:translate-x-2 group-hover:text-primary" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Neon divider */}
      <div className="mx-auto max-w-7xl px-6">
        <div
          className="h-px"
          style={{
            background: "linear-gradient(90deg, transparent, #d946ef, #06b6d4, transparent)",
            boxShadow: "0 0 10px rgba(217, 70, 239, 0.2)",
          }}
        />
      </div>

      {/* About - Cyberpunk panels */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
              Om <span className="text-gradient">klubben</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              HACBC er en klubb for alle som deler lidenskapen for amerikanske
              biler og motorsykler. Vi holder til på Vandrerhjemmet i Hamar og
              arrangerer regelmessige treff, cruising og sosiale samlinger.
            </p>
            <p className="mt-4 text-muted-foreground">
              I sommersesongen arrangerer vi cruising der vi kjører sammen
              gjennom vakre omgivelser i Hamar-regionen.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/cruising">Se cruising-ruter</Link>
            </Button>
          </div>
          <div
            className="flex flex-col justify-center rounded-xl border p-8"
            style={{
              borderColor: "rgba(6, 182, 212, 0.2)",
              background: "rgba(6, 182, 212, 0.03)",
              boxShadow: "0 0 40px rgba(6, 182, 212, 0.05)",
            }}
          >
            <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
              Bli med
            </h3>
            <p className="mt-3 text-sm text-muted-foreground">
              Er du interessert i amerikanske biler eller motorsykler?
              Vi er alltid åpne for nye medlemmer.
            </p>
            <JoinButton label="Registrer deg" />
          </div>
        </div>
      </section>
    </div>
  );
}

// ==============================================
// THUNDER LAYOUT - Racing dashboard, angular, bold
// ==============================================
function ThunderLayout({ upcomingEvents }: ThemedHomeProps) {
  return (
    <div>
      {/* Hero - Bold diagonal split */}
      <section className="hero-section relative min-h-[85vh] overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        {/* Diagonal clip overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
            clipPath: "polygon(0 0, 100% 0, 60% 100%, 0 100%)",
          }}
        />
        {/* Racing stripe accents */}
        <div
          className="pointer-events-none absolute right-[15%] top-0 bottom-0 w-1"
          style={{ background: "linear-gradient(180deg, rgba(59, 130, 246, 0.3), transparent 60%)" }}
        />
        <div
          className="pointer-events-none absolute right-[16%] top-0 bottom-0 w-px"
          style={{ background: "linear-gradient(180deg, rgba(245, 158, 11, 0.2), transparent 40%)" }}
        />
        <div className="relative z-10 mx-auto flex min-h-[85vh] max-w-7xl items-center px-6">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-4">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Hamar American</span>
            </div>
            <div className="flex items-end gap-8">
              <div className="max-w-3xl">
                <h1 className="font-[family-name:var(--font-heading)] text-7xl font-[var(--heading-weight)] uppercase leading-[0.85] tracking-tight sm:text-9xl">
                  Car &amp;
                  <br />
                  <span className="text-gradient">Bike</span>
                  <br />
                  Club
                </h1>
              </div>
              <div className="hidden pb-4 lg:block">
                <Image
                  src="/logo.png"
                  alt="HACBC Logo"
                  width={100}
                  height={100}
                  className="opacity-70"
                  priority
                />
              </div>
            </div>
            <p className="mt-8 max-w-lg text-muted-foreground">
              For entusiaster av amerikanske biler og motorsykler i Hamar-regionen.
              Bli med på treff, cruising og sosialt samvær.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <JoinButton size="lg" />
              <Button asChild variant="outline" size="lg">
                <Link href="/arrangementer">Se arrangementer</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* Bottom angled line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{
            background: "linear-gradient(90deg, var(--accent-color) 0%, var(--accent-secondary) 50%, transparent 100%)",
          }}
        />
      </section>

      {/* Features as a racing-style stats bar */}
      <section
        className="border-y"
        style={{ borderColor: "rgba(59, 130, 246, 0.15)", background: "rgba(8, 20, 40, 0.8)" }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="group relative flex flex-col items-center gap-3 p-8 text-center transition-all duration-300 hover:bg-[rgba(59,130,246,0.05)]"
              >
                {/* Separator */}
                {i > 0 && (
                  <div
                    className="absolute left-0 top-1/4 hidden h-1/2 w-px lg:block"
                    style={{ background: "rgba(59, 130, 246, 0.15)" }}
                  />
                )}
                <feature.icon className="h-8 w-8 text-primary transition-transform group-hover:scale-110" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">{feature.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Next Event - angular card */}
      {upcomingEvents[0] && (
        <section className="mx-auto max-w-7xl px-6 py-10">
          <Link
            href={eventHref(upcomingEvents[0])}
            className="group flex items-center gap-6 p-6 transition-all duration-300"
            style={{
              background: "rgba(59, 130, 246, 0.04)",
              border: "1px solid rgba(59, 130, 246, 0.12)",
              clipPath: "polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))",
            }}
          >
            <div
              className="flex h-16 w-16 flex-shrink-0 flex-col items-center justify-center"
              style={{ background: "var(--accent-color)", clipPath: "polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))" }}
            >
              <span className="text-[10px] font-bold uppercase leading-none text-white">
                {new Date(upcomingEvents[0].date).toLocaleDateString("nb-NO", { month: "short" })}
              </span>
              <span className="text-xl font-bold leading-none text-white">
                {new Date(upcomingEvents[0].date).getDate()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Neste {eventLabel(upcomingEvents[0]).toLowerCase()}</p>
              <h3 className="mt-1 text-xl font-bold">{upcomingEvents[0].title}</h3>
              {upcomingEvents[0].location && (
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" /> {upcomingEvents[0].location}
                </p>
              )}
            </div>
            <ArrowRight className="h-5 w-5 text-primary transition-transform group-hover:translate-x-2" />
          </Link>
        </section>
      )}

      {/* Upcoming Events */}
      <UpcomingEventsList upcomingEvents={upcomingEvents} />

      {/* About - angular panels */}
      <section className="section-divider border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-3">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-6 w-1" style={{ background: "var(--accent-color)" }} />
                <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
                  Om <span className="text-gradient">klubben</span>
                </h2>
              </div>
              <p className="mt-4 text-muted-foreground">
                HACBC er en klubb for alle som deler lidenskapen for amerikanske
                biler og motorsykler. Vi holder til på Vandrerhjemmet i Hamar og
                arrangerer regelmessige treff, cruising og sosiale samlinger.
              </p>
              <p className="mt-4 text-muted-foreground">
                I sommersesongen arrangerer vi cruising der vi kjører sammen
                gjennom vakre omgivelser i Hamar-regionen.
              </p>
              <Button asChild className="mt-6" variant="outline">
                <Link href="/cruising">Se cruising-ruter</Link>
              </Button>
            </div>
            <div
              className="flex flex-col justify-center p-8 md:col-span-2"
              style={{
                background: "rgba(59, 130, 246, 0.04)",
                border: "1px solid rgba(59, 130, 246, 0.12)",
                clipPath: "polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))",
              }}
            >
              <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
                Bli med i klubben
              </h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Er du interessert i amerikanske biler eller motorsykler?
                Vi er alltid åpne for nye medlemmer.
              </p>
              <JoinButton label="Registrer deg" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ==============================================
// DESERT LAYOUT - Cinematic widescreen, film-grain
// ==============================================
function DesertLayout({ upcomingEvents }: ThemedHomeProps) {
  return (
    <div>
      {/* Hero - Extra tall with parallax feel */}
      <section className="hero-section relative min-h-[95vh] overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--hero-gradient)" }} />
        {/* Film grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        {/* Warm radial glow from bottom */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[60%]"
          style={{
            background: "radial-gradient(ellipse at 50% 100%, rgba(217, 119, 6, 0.08) 0%, transparent 60%)",
          }}
        />
        {/* Widescreen letter-boxing feel - thin top bar */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-16" style={{ background: "linear-gradient(180deg, rgba(26, 18, 10, 0.6), transparent)" }} />

        <div className="relative z-10 mx-auto flex min-h-[95vh] max-w-7xl flex-col justify-end px-6 pb-24">
          <Image
            src="/logo.png"
            alt="HACBC Logo"
            width={80}
            height={80}
            className="mb-8 opacity-70"
            priority
          />
          <h1 className="font-[family-name:var(--font-heading)] text-6xl font-[var(--heading-weight)] uppercase leading-[1.1] tracking-wide sm:text-8xl lg:text-9xl">
            Hamar American
            <br />
            <span className="text-gradient">Car &amp; Bike Club</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            For entusiaster av amerikanske biler og motorsykler i
            Hamar-regionen. Bli med på treff, cruising og sosialt samvær.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <JoinButton size="lg" />
            <Button asChild variant="outline" size="lg">
              <Link href="/arrangementer">Se arrangementer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Next Event - cinematic thin bar */}
      {upcomingEvents[0] && (
        <section
          className="border-y"
          style={{ borderColor: "rgba(217, 119, 6, 0.15)" }}
        >
          <div className="mx-auto max-w-7xl px-6 py-4">
            <Link
              href={eventHref(upcomingEvents[0])}
              className="group flex items-center gap-6"
            >
              <span
                className="text-xs font-bold uppercase tracking-[0.3em]"
                style={{ color: "var(--accent-color)" }}
              >
                Neste
              </span>
              <div className="h-4 w-px" style={{ background: "rgba(217, 119, 6, 0.3)" }} />
              <span className="font-medium">{upcomingEvents[0].title}</span>
              <div className="h-4 w-px" style={{ background: "rgba(217, 119, 6, 0.3)" }} />
              <span className="text-sm text-muted-foreground">
                {new Date(upcomingEvents[0].date).toLocaleDateString("nb-NO", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              {upcomingEvents[0].location && (
                <>
                  <div className="h-4 w-px" style={{ background: "rgba(217, 119, 6, 0.3)" }} />
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {upcomingEvents[0].location}
                  </span>
                </>
              )}
              <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-2" />
            </Link>
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <UpcomingEventsList upcomingEvents={upcomingEvents} />

      {/* Features - Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="mb-12 font-[family-name:var(--font-heading)] text-2xl font-[var(--heading-weight)] uppercase tracking-[0.15em]">
            Utforsk
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <Link key={feature.href} href={feature.href} className="group">
                <div
                  className="flex h-48 flex-col justify-end rounded-lg border p-8 transition-all duration-500 hover:bg-card/50"
                  style={{
                    borderColor: "rgba(217, 119, 6, 0.15)",
                    background: i % 2 === 0 ? "rgba(35, 24, 16, 0.3)" : "transparent",
                  }}
                >
                  <feature.icon className="mb-4 h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Warm divider */}
      <div className="mx-auto max-w-7xl px-6">
        <div
          className="h-px"
          style={{ background: "linear-gradient(90deg, var(--accent-color), rgba(220, 38, 38, 0.3), transparent)" }}
        />
      </div>

      {/* About - wide open cinematic */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="grid gap-16 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-[var(--heading-weight)] uppercase tracking-wide">
              Om <span className="text-gradient">klubben</span>
            </h2>
            <p className="mt-6 max-w-2xl leading-relaxed text-muted-foreground">
              HACBC er en klubb for alle som deler lidenskapen for amerikanske
              biler og motorsykler. Vi holder til på Vandrerhjemmet i Hamar og
              arrangerer regelmessige treff, cruising og sosiale samlinger.
            </p>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">
              I sommersesongen arrangerer vi cruising der vi kjører sammen
              gjennom vakre omgivelser i Hamar-regionen.
            </p>
            <Button asChild className="mt-8" variant="outline">
              <Link href="/cruising">Se cruising-ruter</Link>
            </Button>
          </div>
          <div
            className="flex flex-col justify-center border-l p-8"
            style={{ borderColor: "rgba(217, 119, 6, 0.15)" }}
          >
            <h3 className="font-[family-name:var(--font-heading)] text-xl font-[var(--heading-weight)] uppercase tracking-wide">
              Bli med
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Er du interessert i amerikanske biler eller motorsykler?
              Vi er alltid åpne for nye medlemmer. Besøk oss på
              Vandrerhjemmet ved Vikingskipet i Hamar.
            </p>
            <JoinButton label="Registrer deg" />
          </div>
        </div>
      </section>
    </div>
  );
}

// ==============================================
// SHARED COMPONENTS
// ==============================================
function eventHref(event: UpcomingEvent) {
  return event.type === "cruising"
    ? `/cruising/${event.id}`
    : `/arrangementer/${event.id}`;
}

function eventLabel(event: UpcomingEvent) {
  return event.type === "cruising" ? "Cruising" : "Arrangement";
}

function NextEventBanner({ upcomingEvents }: { upcomingEvents: UpcomingEvent[] }) {
  const nextEvent = upcomingEvents[0];
  if (!nextEvent) return null;
  const date = new Date(nextEvent.date);

  return (
    <section className="border-y border-border bg-card/80">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <Link
          href={eventHref(nextEvent)}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-xs font-bold uppercase leading-none">
                {date.toLocaleDateString("nb-NO", { month: "short" })}
              </span>
              <span className="text-xl font-bold leading-none">
                {date.getDate()}
              </span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Neste {eventLabel(nextEvent).toLowerCase()}
              </p>
              <h3 className="text-lg font-bold">{nextEvent.title}</h3>
              {nextEvent.location && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {nextEvent.location}
                </p>
              )}
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>
    </section>
  );
}

function UpcomingEventsList({ upcomingEvents }: { upcomingEvents: UpcomingEvent[] }) {
  const rest = upcomingEvents.slice(1);
  if (rest.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="mb-6 font-[family-name:var(--font-heading)] text-2xl font-bold uppercase tracking-tight">
        Kommende <span className="text-primary">arrangementer</span>
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rest.map((event) => {
          const date = new Date(event.date);
          return (
            <Link key={`${event.type}-${event.id}`} href={eventHref(event)}>
              <Card className="group h-full border-border bg-card transition-colors hover:border-primary/30">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-[10px] font-bold uppercase leading-none">
                      {date.toLocaleDateString("nb-NO", { month: "short" })}
                    </span>
                    <span className="text-xl font-bold leading-none">
                      {date.getDate()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {eventLabel(event)}
                    </p>
                    <h3 className="truncate font-semibold">{event.title}</h3>
                    {event.location && (
                      <p className="mt-1 flex items-center gap-1 truncate text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        {event.location}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section className="section-divider border-t border-border bg-card/50">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
              Om <span className="text-primary">klubben</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              HACBC er en klubb for alle som deler lidenskapen for amerikanske
              biler og motorsykler. Vi holder til på Vandrerhjemmet i Hamar og
              arrangerer regelmessige treff, cruising og sosiale samlinger.
            </p>
            <p className="mt-4 text-muted-foreground">
              I sommersesongen arrangerer vi cruising der vi kjører sammen
              gjennom vakre omgivelser i Hamar-regionen.
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/cruising">Se cruising-ruter</Link>
            </Button>
          </div>
          <div className="flex flex-col justify-center rounded-lg border border-border bg-card p-8">
            <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
              Bli med i klubben
            </h3>
            <p className="mt-3 text-muted-foreground">
              Er du interessert i amerikanske biler eller motorsykler?
              Vi er alltid åpne for nye medlemmer. Besøk oss på
              Vandrerhjemmet ved Vikingskipet i Hamar.
            </p>
            <JoinButton label="Registrer deg" />
          </div>
        </div>
      </div>
    </section>
  );
}

// ==============================================
// MAIN THEMED HOME COMPONENT
// ==============================================
const layoutMap: Record<ThemeId, React.FC<ThemedHomeProps>> = {
  garage: GarageLayout,
  route66: Route66Layout,
  chrome: ChromeLayout,
  midnight: MidnightLayout,
  thunder: ThunderLayout,
  desert: DesertLayout,
};

export default function ThemedHome({ upcomingEvents }: ThemedHomeProps) {
  const { theme } = useTheme();
  const Layout = layoutMap[theme] || GarageLayout;
  return <Layout upcomingEvents={upcomingEvents} />;
}
