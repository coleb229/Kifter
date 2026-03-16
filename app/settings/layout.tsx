"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/navbar";
import { User, Sliders, Database } from "lucide-react";

const tabs = [
  { href: "/settings/profile", label: "Profile", icon: User },
  { href: "/settings/preferences", label: "Preferences", icon: Sliders },
  { href: "/settings/data", label: "Data", icon: Database },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const pathname = usePathname();

  if (status === "unauthenticated") {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 pb-40 sm:px-6 sm:pb-8 lg:px-8">
        <div className="mb-6 animate-fade-up">
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your profile and preferences
          </p>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row">
          {/* Side nav */}
          <nav className="flex shrink-0 flex-row gap-1 sm:w-44 sm:flex-col">
            {tabs.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname === href
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <Icon className="size-4 shrink-0" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Content */}
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </div>
  );
}
