import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Car, Camera, Mail, Users, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function MemberDashboard() {
  const session = await getServerSession(authOptions);
  const userId = session!.user.id;

  const [vehicleCount, unreadCount] = await Promise.all([
    prisma.vehicle.count({ where: { ownerId: userId } }),
    prisma.message.count({ where: { receiverId: userId, read: false } }),
  ]);

  const quickLinks = [
    {
      label: "Mine kjøretøy",
      value: vehicleCount,
      icon: Car,
      href: "/medlem/kjoretoy",
      description: "Se og administrer kjøretøyene dine",
    },
    {
      label: "Last opp bilder",
      icon: Camera,
      href: "/medlem/bilder",
      description: "Del bilder fra treff og arrangementer",
    },
    {
      label: "Meldinger",
      value: unreadCount,
      icon: Mail,
      href: "/medlem/meldinger",
      description: "Send og motta meldinger",
      highlight: unreadCount > 0,
    },
    {
      label: "Dokumenter",
      icon: FileText,
      href: "/medlem/dokumenter",
      description: "Vedtekter, referater og andre dokumenter",
    },
    {
      label: "Medlemsliste",
      icon: Users,
      href: "/medlem/medlemmer",
      description: "Se alle klubbmedlemmer",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase tracking-tight">
        Velkommen, <span className="text-hacbc-red">{session!.user.name}</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        Her kan du administrere profilen din, kjøretøy og meldinger.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card
              className={`h-full border-border transition-colors hover:border-hacbc-red/30 ${
                link.highlight ? "border-hacbc-red/50" : ""
              }`}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <link.icon
                  className={`h-10 w-10 shrink-0 ${
                    link.highlight ? "text-hacbc-red" : "text-muted-foreground"
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-semibold">{link.label}</p>
                    {link.value !== undefined && link.value > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          link.highlight
                            ? "bg-hacbc-red/20 text-hacbc-red"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {link.value}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {link.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link
          href="/medlem/profil"
          className="text-sm text-hacbc-red hover:underline"
        >
          Rediger profilen din
        </Link>
      </div>
    </div>
  );
}
