"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { ShieldCheck } from "lucide-react";

export function AdminFab() {
  const { data: session } = useSession();
  if (session?.user?.role !== "admin") return null;

  return (
    <Link
      href="/admin"
      aria-label="Admin panel"
      className={[
        "group",
        "fixed bottom-5 right-5 z-40",
        "flex items-center gap-2 overflow-hidden",
        "h-10 w-10 rounded-full",
        "bg-indigo-600 text-white shadow-lg shadow-indigo-500/40",
        "transition-all duration-200 ease-out",
        "hover:w-36 hover:rounded-xl hover:bg-indigo-500 hover:shadow-indigo-400/50 hover:shadow-xl hover:-translate-y-0.5",
        "active:scale-95 active:shadow-md active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2",
      ].join(" ")}
    >
      <ShieldCheck className="size-5 shrink-0 ml-2.5" />
      <span className="whitespace-nowrap text-xs font-semibold opacity-0 -translate-x-1 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 pr-3">
        Admin Panel
      </span>
    </Link>
  );
}
