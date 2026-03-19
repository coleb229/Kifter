"use client";

import { useState, useEffect } from "react";
import { X, Lightbulb } from "lucide-react";

interface Props {
  tipKey: string; // unique key for localStorage — dismiss state is per-tip
  title: string;
  description: string;
  className?: string;
}

export function OnboardingTip({ tipKey, title, description, className = "" }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`onboarding:${tipKey}`);
    if (!dismissed) setVisible(true);
  }, [tipKey]);

  function dismiss() {
    localStorage.setItem(`onboarding:${tipKey}`, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-900 dark:bg-indigo-950/30 ${className}`}
    >
      <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/60">
        <Lightbulb className="size-4 text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">{title}</p>
        <p className="mt-0.5 text-xs text-indigo-700 dark:text-indigo-300">{description}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="mt-0.5 rounded p-0.5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
        aria-label="Dismiss tip"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
