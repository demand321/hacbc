export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { Car, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/BackButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [vehicle, session] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { id },
      select: { make: true, model: true, year: true, published: true, ownerId: true },
    }),
    getServerSession(authOptions),
  ]);
  const canView =
    !!vehicle &&
    (vehicle.published ||
      session?.user.id === vehicle.ownerId ||
      session?.user.role === "ADMIN");
  if (!canView) return { title: "Kjøretøy ikke funnet" };
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

  const [vehicle, session] = await Promise.all([
    prisma.vehicle.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true, memberStatus: true } },
      },
    }),
    getServerSession(authOptions),
  ]);

  if (!vehicle || vehicle.owner.memberStatus === "DELETED") notFound();

  const isOwner = !!session && session.user.id === vehicle.owner.id;
  const isAdmin = session?.user.role === "ADMIN";

  // Unpublished vehicles are only visible to their owner or an admin.
  if (!vehicle.published && !isOwner && !isAdmin) notFound();

  const canPrintPoster = isOwner || isAdmin;

  const specs =
    vehicle.specs && typeof vehicle.specs === "object"
      ? (vehicle.specs as Record<string, string>)
      : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between gap-2">
        <BackButton fallbackHref="/kjoretoy">Tilbake til kjøretøy</BackButton>
        {canPrintPoster && (
          <Button variant="outline" asChild><Link href={`/kjoretoy/${id}/plakat`}>
            <Printer className="mr-2 h-4 w-4" />
            Skriv ut plakat
          </Link></Button>
        )}
      </div>

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
