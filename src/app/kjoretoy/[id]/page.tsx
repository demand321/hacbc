export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Car } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id, published: true },
  });
  if (!vehicle) return { title: "Kjøretøy ikke funnet" };
  return {
    title: `${vehicle.make} ${vehicle.model}${vehicle.year ? ` (${vehicle.year})` : ""}`,
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id, published: true },
    include: {
      owner: { select: { name: true, avatarUrl: true } },
    },
  });

  if (!vehicle) notFound();

  const specs =
    vehicle.specs && typeof vehicle.specs === "object"
      ? (vehicle.specs as Record<string, string>)
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <Button variant="ghost" className="mb-6" asChild><Link href="/kjoretoy">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Tilbake til kjøretøy
      </Link></Button>

      {/* Images */}
      {vehicle.imageUrls.length > 0 ? (
        <div className="space-y-4">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl">
            <img
              src={vehicle.imageUrls[0]}
              alt={`${vehicle.make} ${vehicle.model}`}
              className="h-full w-full object-cover"
            />
          </div>
          {vehicle.imageUrls.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {vehicle.imageUrls.slice(1).map((url: string, idx: number) => (
                <div
                  key={idx}
                  className="relative aspect-square overflow-hidden rounded-lg"
                >
                  <img
                    src={url}
                    alt={`${vehicle.make} ${vehicle.model} bilde ${idx + 2}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl bg-muted">
          <Car className="h-20 w-20 text-muted-foreground/50" />
        </div>
      )}

      {/* Info */}
      <div className="mt-8">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight sm:text-4xl">
          {vehicle.make}{" "}
          <span className="text-hacbc-red">{vehicle.model}</span>
        </h1>
        {vehicle.year && (
          <p className="mt-1 text-xl text-muted-foreground">{vehicle.year}</p>
        )}

        <div className="mt-2 text-sm text-muted-foreground">
          Eier: {vehicle.owner.name}
        </div>

        {vehicle.description && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">Beskrivelse</h2>
            <p className="whitespace-pre-line text-muted-foreground">
              {vehicle.description}
            </p>
          </div>
        )}

        {specs && Object.keys(specs).length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">Spesifikasjoner</h2>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(specs).map(([key, value]) => (
                    <tr key={key} className="border-b border-border last:border-0">
                      <td className="bg-muted/50 px-4 py-2 font-medium">
                        {key}
                      </td>
                      <td className="px-4 py-2 text-muted-foreground">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
