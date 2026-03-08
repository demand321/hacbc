import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Car, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteVehicleButton } from "./DeleteVehicleButton";

export default async function MyVehiclesPage() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
          Mine <span className="text-hacbc-red">kjøretøy</span>
        </h1>
        <Button asChild>
          <Link href="/medlem/kjoretoy/ny">
            <Plus className="mr-2 h-4 w-4" />
            Registrer nytt
          </Link>
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="mt-12 text-center">
          <Car className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">
            Du har ikke registrert noen kjøretøy ennå.
          </p>
          <Button asChild className="mt-4">
            <Link href="/medlem/kjoretoy/ny">Registrer ditt første kjøretøy</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Card
              key={vehicle.id}
              className="border-border transition-colors hover:border-hacbc-red/30"
            >
              {vehicle.imageUrls.length > 0 && (
                <div className="aspect-video overflow-hidden rounded-t-lg">
                  <img
                    src={vehicle.imageUrls[0]}
                    alt={`${vehicle.make} ${vehicle.model}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold">
                  {vehicle.make} {vehicle.model}
                </h3>
                {vehicle.year && (
                  <p className="text-sm text-muted-foreground">
                    Årsmodell: {vehicle.year}
                  </p>
                )}
                {vehicle.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {vehicle.description}
                  </p>
                )}
                <div className="mt-4 flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/medlem/kjoretoy/${vehicle.id}/rediger`}>
                      <Pencil className="mr-1 h-3 w-3" />
                      Rediger
                    </Link>
                  </Button>
                  <DeleteVehicleButton vehicleId={vehicle.id} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {vehicle.published ? "Publisert" : "Ikke publisert"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
