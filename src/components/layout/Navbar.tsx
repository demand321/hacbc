"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, User, LogOut, Shield } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";

const publicLinks = [
  { href: "/kjoretoy", label: "Kjøretøy" },
  { href: "/arrangementer", label: "Eventer" },
  { href: "/galleri", label: "Galleri" },
];

const memberLinks = [
  { href: "/medlem", label: "Mitt område" },
  { href: "/medlem/medlemmer", label: "Medlemmer" },
  { href: "/medlem/shop", label: "Klubbshop" },
  { href: "/medlem/dokumenter", label: "Dokumenter" },
  { href: "/medlem/meldinger", label: "Meldinger" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const isApproved = session?.user?.memberStatus === "APPROVED";
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <nav className="nav-bar sticky top-0 z-50 border-b border-border bg-[var(--nav-bg)] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="HACBC"
              width={40}
              height={40}
              className="rounded"
            />
            <span className="hidden text-lg font-bold tracking-tight sm:block">
              <span className="text-primary">HACBC</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {session && isApproved && (
              <>
                <div className="mx-2 h-4 w-px bg-border" />
                {memberLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            {session ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {session.user.name}
                  </span>
                </Button>
                {menuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setMenuOpen(false)}
                    />
                    <div className="absolute right-0 z-50 mt-1 w-48 rounded-md border border-border bg-popover p-1 shadow-lg">
                      {isApproved && (
                        <button
                          className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                          onClick={() => {
                            router.push("/medlem/profil");
                            setMenuOpen(false);
                          }}
                        >
                          Min profil
                        </button>
                      )}
                      {isAdmin && (
                        <>
                          <div className="my-1 h-px bg-border" />
                          <button
                            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm text-primary hover:bg-accent"
                            onClick={() => {
                              router.push("/admin");
                              setMenuOpen(false);
                            }}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Admin
                          </button>
                        </>
                      )}
                      <div className="my-1 h-px bg-border" />
                      <button
                        className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
                        onClick={() => signOut()}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logg ut
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Button asChild size="sm" variant="default">
                <Link href="/logg-inn">Logg inn</Link>
              </Button>
            )}

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-border pb-4 md:hidden">
            <div className="flex flex-col gap-1 pt-2">
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    isActive(link.href)
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {session && isApproved && (
                <>
                  <div className="my-1 h-px bg-border" />
                  {memberLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`rounded-md px-3 py-2 text-sm font-medium ${
                        isActive(link.href)
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2 text-sm font-medium text-primary"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
