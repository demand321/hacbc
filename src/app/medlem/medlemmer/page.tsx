import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MemberList } from "./MemberList";

export const dynamic = "force-dynamic";

export default async function MemberDirectoryPage() {
  const session = await getServerSession(authOptions);
  const currentUserId = session!.user.id;

  const members = await prisma.user.findMany({
    where: { memberStatus: "APPROVED" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      postalCode: true,
      city: true,
      avatarUrl: true,
      memberSince: true,
      vehicles: {
        where: { published: true },
        select: { make: true, model: true, year: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const serialized = members.map((m) => ({
    ...m,
    memberSince: m.memberSince?.toISOString() ?? null,
    vehicleCount: m.vehicles.length,
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
        <span className="text-hacbc-red">Medlemmer</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        {members.length} godkjente medlemmer
      </p>

      <MemberList members={serialized} currentUserId={currentUserId} />
    </div>
  );
}
