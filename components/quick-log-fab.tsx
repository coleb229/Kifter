"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Props {
  /** Navigate to this URL on click (for cardio/diet new pages). */
  href?: string;
  /** Scroll to and focus the element with this id (for in-page forms). */
  targetId?: string;
  label?: string;
}

export function QuickLogFAB({ href, targetId, label = "Log" }: Props) {
  const router = useRouter();

  function handleClick() {
    if (href) {
      router.push(href);
      return;
    }
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        // Focus the first focusable input/select inside the target
        const focusable = el.querySelector<HTMLElement>(
          "select, input, textarea, button:not([disabled])"
        );
        focusable?.focus({ preventScroll: true });
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      className="fixed bottom-20 right-4 z-50 flex items-center gap-1.5 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95 sm:bottom-6"
    >
      <Plus className="size-4" />
      {label}
    </button>
  );
}
