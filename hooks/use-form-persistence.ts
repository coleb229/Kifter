"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// localStorage key where the user's cache duration preference is stored
const PREF_KEY = "kifted-draft-duration";

const DURATION_MS: Record<string, number> = {
  "1h":  1 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d":  7 * 24 * 60 * 60 * 1000,
};

function getDurationMs(): number | null {
  if (typeof window === "undefined") return DURATION_MS["24h"];
  const pref = localStorage.getItem(PREF_KEY) ?? "24h";
  if (pref === "off") return null;
  return DURATION_MS[pref] ?? DURATION_MS["24h"];
}

interface StoredDraft<T> {
  values: Partial<T>;
  savedAt: number;
}

export interface UseFormPersistenceReturn {
  /** True for 2 seconds after each auto-save */
  isDraftSaved: boolean;
  /** True when a non-expired draft was found on mount and restored */
  hasDraft: boolean;
  /** Call this after a successful submit to clear the stored draft */
  clearDraft: () => void;
}

/**
 * Persists react-hook-form values to localStorage and restores them on mount.
 *
 * Usage:
 * ```tsx
 * const values = watch();
 * const { isDraftSaved, clearDraft } = useFormPersistence({
 *   key: "session-form",
 *   values,
 *   reset,
 * });
 * ```
 *
 * On successful submit call `clearDraft()` before navigating away.
 */
export function useFormPersistence<T extends Record<string, unknown>>({
  key,
  values,
  reset,
  exclude = [],
}: {
  key: string;
  values: T;
  reset: (values: Partial<T>) => void;
  /** Field names to skip when saving (e.g. file inputs) */
  exclude?: (keyof T)[];
}): UseFormPersistenceReturn {
  const storageKey = `kifted-draft:${key}`;
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const restoredRef = useRef(false);

  // Restore draft on mount (once)
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const durationMs = getDurationMs();
    if (durationMs === null) return; // caching disabled by preference

    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const { values: stored, savedAt } = JSON.parse(raw) as StoredDraft<T>;
      if (Date.now() - savedAt > durationMs) {
        localStorage.removeItem(storageKey);
        return;
      }
      reset(stored);
      setHasDraft(true);
    } catch {
      // ignore parse / storage errors
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save with debounce whenever values change
  useEffect(() => {
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const durationMs = getDurationMs();
      if (durationMs === null) return; // caching disabled

      const filtered = Object.fromEntries(
        Object.entries(values).filter(([k]) => !exclude.includes(k as keyof T))
      ) as Partial<T>;

      try {
        const draft: StoredDraft<T> = { values: filtered, savedAt: Date.now() };
        localStorage.setItem(storageKey, JSON.stringify(draft));

        // Flash "Draft saved" for 2 seconds
        setIsDraftSaved(true);
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setIsDraftSaved(false), 2000);
      } catch {
        // ignore quota-exceeded / private-mode errors
      }
    }, 800);

    return () => clearTimeout(saveTimerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(values)]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch { /* ignore */ }
    setHasDraft(false);
    setIsDraftSaved(false);
  }, [storageKey]);

  return { isDraftSaved, hasDraft, clearDraft };
}
