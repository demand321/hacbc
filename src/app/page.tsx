import Link from "next/link";
import Image from "next/image";
import { Calendar, Car, Camera, ShoppingBag, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

const features = [
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
    icon: ShoppingBag,
    title: "Klubbshop",
    description: "Caps, luer og mer",
    href: "/shop",
  },
];

export const dynamic = "force-dynamic";

export default async function Home() {
  const nextEvent = await prisma.event.findFirst({
    where: { isPublished: true, date: { gte: new Date() } },
    orderBy: { date: "asc" },
  });

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
            <Button asChild size="lg">
              <Link href="/registrer">Bli medlem</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/arrangementer">Se arrangementer</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Next Event Banner */}
      {nextEvent && (
        <section className="border-y border-border bg-card/80">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <Link
              href={`/arrangementer/${nextEvent.id}`}
              className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-xs font-bold uppercase leading-none">
                    {nextEvent.date.toLocaleDateString("nb-NO", { month: "short" })}
                  </span>
                  <span className="text-xl font-bold leading-none">
                    {nextEvent.date.getDate()}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Neste arrangement
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
      )}

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className="feature-card group h-full border-border bg-card transition-all duration-300 hover:border-[var(--card-hover-border)]">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <feature.icon className="mb-4 h-10 w-10 text-primary transition-transform duration-300 group-hover:scale-110" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* About */}
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
                I sommersesongen arrangerer vi onsdags-cruising der vi kjører
                sammen gjennom vakre omgivelser i Hamar-regionen.
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
              <Button asChild className="mt-4 w-fit">
                <Link href="/registrer">Registrer deg</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
