import Link from "next/link";
import { Calendar, Car, Camera, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-hacbc-red/5 via-transparent to-transparent" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
          <h1 className="font-[family-name:var(--font-heading)] text-5xl font-bold uppercase tracking-tight sm:text-7xl">
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

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <Card className="group h-full border-border bg-card transition-colors hover:border-hacbc-red/30">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <feature.icon className="mb-4 h-10 w-10 text-hacbc-red transition-transform group-hover:scale-110" />
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

      {/* Info */}
      <section className="border-t border-border bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
                Om <span className="text-hacbc-red">klubben</span>
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
            </div>
            <div className="flex flex-col justify-center rounded-lg border border-border bg-card p-6">
              <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold uppercase">
                Neste arrangement
              </h3>
              <p className="mt-2 text-muted-foreground">
                Sjekk arrangementssiden for kommende treff og aktiviteter.
              </p>
              <Button asChild className="mt-4 w-fit" variant="outline">
                <Link href="/arrangementer">Se treffliste</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
