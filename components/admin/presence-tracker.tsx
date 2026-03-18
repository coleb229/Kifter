"use client";

import { useEffect } from "react";
import { updateLastSeen } from "@/actions/user-actions";

export function PresenceTracker() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    function ping() {
      if (document.visibilityState !== "hidden") {
        updateLastSeen().catch(() => {});
      }
    }

    // Ping immediately on mount, then every 60s
    ping();
    interval = setInterval(ping, 60_000);

    return () => clearInterval(interval);
  }, []);

  return null;
}
