"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Dumbbell, Utensils, Activity, Scale, Users } from "lucide-react";

const NAV_ITEMS = [
  { href: "/",          label: "Home",      Icon: LayoutDashboard },
  { href: "/training",  label: "Training",  Icon: Dumbbell },
  { href: "/diet",      label: "Diet",      Icon: Utensils },
  { href: "/cardio",    label: "Cardio",    Icon: Activity },
  { href: "/body",      label: "Body",      Icon: Scale },
  { href: "/community", label: "Community", Icon: Users },
] as const;

export function MobileBottomNav() {
  const { status } = useSession();
  const pathname = usePathname();

  if (status !== "authenticated") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden border-t border-border bg-background/90 backdrop-blur supports-[padding:env(safe-area-inset-bottom)]:pb-[env(safe-area-inset-bottom)]">
      <div className="flex h-16 items-stretch">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors ${
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`size-5 transition-transform ${active ? "scale-110" : ""}`} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
