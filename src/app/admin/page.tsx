import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Calendar, ShoppingBag, Clock } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const [memberCount, pendingCount, eventCount, orderCount] = await Promise.all(
    [
      prisma.user.count({ where: { memberStatus: "APPROVED" } }),
      prisma.user.count({ where: { memberStatus: "PENDING" } }),
      prisma.event.count(),
      prisma.order.count({ where: { status: "ny" } }),
    ]
  );

  const stats = [
    {
      label: "Medlemmer",
      value: memberCount,
      icon: Users,
      href: "/admin/medlemmer",
    },
    {
      label: "Venter godkjenning",
      value: pendingCount,
      icon: Clock,
      href: "/admin/medlemmer",
      highlight: pendingCount > 0,
    },
    {
      label: "Arrangementer",
      value: eventCount,
      icon: Calendar,
      href: "/admin/arrangementer",
    },
    {
      label: "Nye bestillinger",
      value: orderCount,
      icon: ShoppingBag,
      href: "/admin/shop",
    },
  ];

  return (
    <div>
      <h2 className="mb-6 text-xl font-semibold">Oversikt</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card
              className={`border-border transition-colors hover:border-hacbc-red/30 ${
                stat.highlight ? "border-hacbc-red/50" : ""
              }`}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <stat.icon
                  className={`h-8 w-8 ${
                    stat.highlight ? "text-hacbc-red" : "text-muted-foreground"
                  }`}
                />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
