"use client";

import { useState, useEffect, useRef } from "react";
import { Download, X } from "lucide-react";

export function PwaInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const deferredEvent = useRef<Event & { prompt: () => Promise<void> } | null>(null);

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      deferredEvent.current = e as typeof deferredEvent.current;

      // Only show after 3+ sessions logged
      const sessionCount = parseInt(localStorage.getItem("kifted_session_count") ?? "0", 10);
      if (sessionCount >= 3) {
        const dismissed = localStorage.getItem("kifted_pwa_dismissed");
        if (!dismissed) setShowPrompt(true);
      }
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  async function handleInstall() {
    if (!deferredEvent.current) return;
    await deferredEvent.current.prompt();
    setShowPrompt(false);
  }

  function handleDismiss() {
    localStorage.setItem("kifted_pwa_dismissed", "1");
    setShowPrompt(false);
  }

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 inset-x-4 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-xl sm:inset-x-auto sm:right-6 sm:w-80">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/40">
        <Download className="size-5 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Add to Home Screen</p>
        <p className="text-xs text-muted-foreground">Get faster access to Kifted</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={handleInstall}
          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Install
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
