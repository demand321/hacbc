import { prisma } from "@/lib/prisma";
import { MemberManagement } from "./MemberManagement";

export default async function AdminMembersPage() {
  const users = await prisma.user.findMany({
    orderBy: [{ memberStatus: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      memberStatus: true,
      memberSince: true,
      createdAt: true,
    },
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Medlemshåndtering</h2>
      <MemberManagement users={users} />
    </div>
  );
}
