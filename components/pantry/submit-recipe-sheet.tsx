"use client";

import { useState, useTransition } from "react";
import { Check, Link2 } from "lucide-react";
import { submitRecipeUrl } from "@/actions/pantry-actions";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";

interface SubmitRecipeSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SubmitRecipeSheet({ open, onClose }: SubmitRecipeSheetProps) {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    setUrl("");
    setNotes("");
    setError("");
    setSuccess(false);
    onClose();
  }

  function handleSubmit() {
    setError("");
    if (!url.trim()) {
      setError("URL is required");
      return;
    }
    try {
      new URL(url.trim());
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    startTransition(async () => {
      const result = await submitRecipeUrl(url.trim(), notes.trim() || undefined);
      if (result.success) {
        setSuccess(true);
        setTimeout(handleClose, 1500);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <BottomSheet open={open} onClose={handleClose} title={success ? undefined : "Submit a Recipe"}>
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
            <Check className="size-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="font-semibold">Submitted!</p>
          <p className="text-sm text-muted-foreground">We&apos;ll review this recipe and add it to the library</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-muted-foreground">
            Found a great recipe? Paste the link and we&apos;ll review it for the library.
          </p>

          {/* URL input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="recipe-url">Recipe URL</label>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="recipe-url"
                type="url"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setError(""); }}
                placeholder="https://example.com/recipe"
                className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="recipe-notes">
              Notes <span className="font-normal">(optional)</span>
            </label>
            <textarea
              id="recipe-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Great high-protein lunch option"
              rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}

          {/* Submit button */}
          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? "Submitting..." : "Submit Recipe"}
          </Button>
        </div>
      )}
    </BottomSheet>
  );
}
