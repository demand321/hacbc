import { prisma } from "@/lib/prisma";
import { VehicleManagement } from "./VehicleManagement";

export const dynamic = "force-dynamic";

export default async function AdminVehiclesPage() {
  const [vehicles, members] = await Promise.all([
    prisma.vehicle.findMany({
      orderBy: { createdAt: "desc" },
      include: { owner: { select: { id: true, name: true } } },
    }),
    prisma.user.findMany({
      where: { memberStatus: "APPROVED" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Kjøretøyhåndtering</h2>
      <VehicleManagement vehicles={vehicles} members={members} />
    </div>
  );
}
