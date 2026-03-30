"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, options?: { action?: ToastAction; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const VARIANT_STYLES: Record<ToastVariant, { bg: string; icon: React.ElementType }> = {
  success: { bg: "bg-emerald-600 text-white", icon: CheckCircle2 },
  error:   { bg: "bg-rose-600 text-white",    icon: AlertCircle },
  info:    { bg: "bg-indigo-600 text-white",   icon: Info },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "success", options?: { action?: ToastAction; duration?: number }) => {
    const id = ++nextId;
    const duration = options?.duration ?? (options?.action ? 5000 : 2500);
    setToasts((prev) => [...prev, { id, message, variant, action: options?.action }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
  }, []);

  return (
    <ToastContext value={{ showToast }}>
      {children}
      {toasts.length > 0 && (
        <div className="fixed bottom-20 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 sm:bottom-6">
          {toasts.map((toast) => {
            const { bg, icon: Icon } = VARIANT_STYLES[toast.variant];
            return (
              <div
                key={toast.id}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg animate-fade-up motion-reduce:animate-none ${bg}`}
              >
                <Icon className="size-4 shrink-0" />
                <span className="max-w-[260px] truncate">{toast.message}</span>
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action!.onClick();
                      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
                    }}
                    className="ml-1 shrink-0 rounded-md bg-white/20 px-2.5 py-1 text-xs font-semibold hover:bg-white/30 transition-colors"
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
                  className="ml-1 shrink-0 rounded p-0.5 opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </ToastContext>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
