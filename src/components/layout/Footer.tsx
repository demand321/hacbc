import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-primary">
              HACBC
            </h3>
            <p className="text-sm text-muted-foreground">
              Hamar American Car &amp; Bike Club
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vandrerhjemmet, Hamar
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Lenker
            </h3>
            <div className="flex flex-col gap-2 text-sm">
              <Link
                href="/arrangementer"
                className="text-muted-foreground hover:text-foreground"
              >
                Eventer
              </Link>
              <Link
                href="/kjoretoy"
                className="text-muted-foreground hover:text-foreground"
              >
                Kjøretøy
              </Link>
              <Link
                href="/galleri"
                className="text-muted-foreground hover:text-foreground"
              >
                Galleri
              </Link>
              <Link
                href="/shop"
                className="text-muted-foreground hover:text-foreground"
              >
                Klubbshop
              </Link>
            </div>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Bli medlem
            </h3>
            <p className="text-sm text-muted-foreground">
              Interessert i amerikanske biler og motorsykler? Ta kontakt eller
              registrer deg!
            </p>
            <Link
              href="/registrer"
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              Registrer deg her
            </Link>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Hamar American Car &amp; Bike Club.
          Alle rettigheter reservert.
        </div>
      </div>
    </footer>
  );
}
