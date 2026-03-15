"use client";

import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { signInWithGoogle } from "@/actions/auth-actions";

export function Navbar() {
  const { data: session, status } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <a href="/" className="text-lg font-bold tracking-tight">
          Kifted
        </a>

        {/* Center nav */}
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          {!session && (
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
          )}
          {session && (
            <>
              <a href="/training" className="transition-colors hover:text-foreground">
                Training
              </a>
              <a href="/training/guides" className="transition-colors hover:text-foreground">
                Guides
              </a>
              <a href="/community" className="transition-colors hover:text-foreground">
                Community
              </a>
            </>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {status === "loading" && (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-muted" />
          )}

          {status === "unauthenticated" && (
            <form action={signInWithGoogle}>
              <Button type="submit" variant="outline" size="sm">
                Sign In
              </Button>
            </form>
          )}

          {status === "authenticated" && session && (
            <UserMenu
              name={session.user?.name}
              email={session.user?.email}
              image={session.user?.image}
              role={session.user?.role}
            />
          )}
        </div>
      </div>
    </header>
  );
}
