"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const dragCurrentY = useRef(0);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
    } else if (!open && el.open) {
      el.close();
    }
  }, [open]);

  // Close on Escape (native dialog behavior) + backdrop click
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const handleClose = () => onClose();
    el.addEventListener("close", handleClose);
    return () => el.removeEventListener("close", handleClose);
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) onClose();
    },
    [onClose]
  );

  // Drag-to-dismiss on the handle
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragStartY.current = e.clientY;
    dragCurrentY.current = 0;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (dragStartY.current === null) return;
    const delta = Math.max(0, e.clientY - dragStartY.current);
    dragCurrentY.current = delta;
    if (contentRef.current) {
      contentRef.current.style.transform = `translateY(${delta}px)`;
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragStartY.current === null) return;
    const wasDragged = dragCurrentY.current > 100;
    dragStartY.current = null;
    if (contentRef.current) {
      contentRef.current.style.transform = "";
    }
    if (wasDragged) onClose();
  }, [onClose]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 m-0 h-full w-full max-h-full max-w-full bg-transparent p-0 backdrop:bg-black/40 backdrop:backdrop-blur-[1px] open:flex open:items-end sm:open:items-center sm:open:justify-center"
    >
      <div
        ref={contentRef}
        className="w-full max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-background shadow-xl transition-transform duration-150 sm:max-w-lg sm:rounded-2xl sm:max-h-[80vh]"
      >
        {/* Drag handle — mobile only */}
        <div
          className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing sm:hidden touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-2 pt-1 sm:pt-4">
            <h3 className="text-base font-semibold">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className={title ? "px-4 pb-4" : "p-4"}>
          {children}
        </div>
      </div>
    </dialog>
  );
}
