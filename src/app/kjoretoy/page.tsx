import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Car } from "lucide-react";

export const metadata = {
  title: "Kjøretøy",
  description: "Se medlemmenes amerikanske biler og motorsykler",
};

export default async function KjoretoyPage() {
  const vehicles = await prisma.vehicle.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { name: true } },
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-4xl font-bold uppercase tracking-tight sm:text-5xl">
        Kjøretøy<span className="text-hacbc-red">galleri</span>
      </h1>
      <p className="mt-4 text-muted-foreground">
        Se medlemmenes amerikanske biler og motorsykler.
      </p>

      {vehicles.length === 0 ? (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <Car className="mb-4 h-16 w-16 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Ingen kjøretøy ennå</h2>
          <p className="mt-2 text-muted-foreground">
            Det er ingen publiserte kjøretøy for øyeblikket. Sjekk tilbake
            senere!
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle: { id: string; make: string; model: string; year: number | null; imageUrls: string[]; owner: { name: string } }) => (
            <Link key={vehicle.id} href={`/kjoretoy/${vehicle.id}`}>
              <Card className="group h-full border-border bg-card transition-colors hover:border-hacbc-red/30">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-xl">
                  {vehicle.imageUrls.length > 0 ? (
                    <img
                      src={vehicle.imageUrls[0]}
                      alt={`${vehicle.make} ${vehicle.model}`}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <Car className="h-12 w-12 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <CardContent className="pt-2">
                  <h3 className="font-[family-name:var(--font-heading)] text-lg font-bold uppercase">
                    {vehicle.make} {vehicle.model}
                  </h3>
                  <div className="mt-1 flex items-center justify-between">
                    {vehicle.year && (
                      <span className="text-hacbc-red font-semibold">
                        {vehicle.year}
                      </span>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {vehicle.owner.name}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
