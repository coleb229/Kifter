"use client";

import { useRef, useState, useTransition } from "react";
import { Barcode, Camera, Loader2, X, Plus } from "lucide-react";
import { lookupBarcode } from "@/actions/food-actions";
import type { FoodSearchResult } from "@/actions/food-actions";

interface Props {
  onSelect: (food: FoodSearchResult) => void;
}

export function BarcodeScanner({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<FoodSearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setManual("");
    setResult(null);
    setNotFound(false);
    setError(null);
  }

  function close() {
    reset();
    setOpen(false);
  }

  function lookup(barcode: string) {
    setResult(null);
    setNotFound(false);
    setError(null);
    startTransition(async () => {
      const res = await lookupBarcode(barcode);
      if (!res.success) {
        setError(res.error);
      } else if (!res.data) {
        setNotFound(true);
      } else {
        setResult(res.data);
      }
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    // Try BarcodeDetector API (Chrome/Android)
    if ("BarcodeDetector" in window) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"] });
        const bitmap = await createImageBitmap(file);
        const barcodes = await detector.detect(bitmap);
        if (barcodes.length > 0) {
          lookup(barcodes[0].rawValue);
          return;
        }
      } catch {
        // fall through to manual
      }
    }

    setError("Could not detect a barcode. Enter it manually below.");
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manual.trim()) lookup(manual.trim());
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        title="Scan barcode"
      >
        <Barcode className="size-4" />
        Barcode
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Barcode className="size-4 text-amber-500" />
          <p className="text-sm font-semibold">Barcode Lookup</p>
        </div>
        <button type="button" onClick={close} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      {/* Camera scan button */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:opacity-60"
        >
          <Camera className="size-4" />
          Scan with camera
        </button>
        <span className="text-xs text-muted-foreground">or enter manually</span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Manual entry */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Barcode number (e.g. 012345678905)"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500"
        />
        <button
          type="submit"
          disabled={!manual.trim() || isPending}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : "Look up"}
        </button>
      </form>

      {/* States */}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {notFound && <p className="text-sm text-muted-foreground">Product not found in Open Food Facts database.</p>}

      {result && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{result.name}</p>
            <p className="text-xs text-muted-foreground">
              {result.calories} kcal · P {result.protein}g · C {result.carbs}g · F {result.fat}g
              <span className="ml-1 opacity-60">per {result.servingSize}{result.servingUnit}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => { onSelect(result); close(); }}
            className="flex shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:brightness-110"
          >
            <Plus className="size-3" /> Add
          </button>
        </div>
      )}
    </div>
  );
}
