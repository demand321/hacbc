import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MemberDirectoryPage() {
  const session = await getServerSession(authOptions);
  const currentUserId = session!.user.id;

  const members = await prisma.user.findMany({
    where: { memberStatus: "APPROVED" },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      memberSince: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
        <span className="text-hacbc-red">Medlemmer</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        {members.length} godkjente medlemmer
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((member) => (
          <Card
            key={member.id}
            className="border-border transition-colors hover:border-hacbc-red/30"
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-lg font-semibold">
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt={member.name}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                ) : (
                  member.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{member.name}</p>
                {member.memberSince && (
                  <p className="text-xs text-muted-foreground">
                    Medlem siden{" "}
                    {member.memberSince.toLocaleDateString("nb-NO", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
                {member.id !== currentUserId && (
                  <Button asChild size="sm" variant="ghost" className="mt-1 h-7 px-2">
                    <Link href={`/medlem/meldinger/${member.id}`}>
                      <Mail className="mr-1 h-3 w-3" />
                      Send melding
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
