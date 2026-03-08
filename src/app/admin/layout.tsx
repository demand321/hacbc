import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Users, Calendar, ShoppingBag, Image, Route, FileText } from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Dashboard", icon: FileText },
  { href: "/admin/medlemmer", label: "Medlemmer", icon: Users },
  { href: "/admin/arrangementer", label: "Arrangementer", icon: Calendar },
  { href: "/admin/shop", label: "Klubbshop", icon: ShoppingBag },
  { href: "/admin/galleri", label: "Galleri", icon: Image },
  { href: "/admin/cruising", label: "Cruising", icon: Route },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold uppercase">
          <span className="text-hacbc-red">Admin</span>panel
        </h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-1 overflow-x-auto lg:flex-col">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
