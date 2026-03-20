"use client";

import { useRef, useState, useEffect, useTransition } from "react";
import { Barcode, Camera, Loader2, X, Plus, AlertCircle } from "lucide-react";
import { lookupBarcode } from "@/actions/food-actions";
import type { FoodSearchResult } from "@/actions/food-actions";

interface Props {
  onSelect: (food: FoodSearchResult) => void;
  defaultOpen?: boolean;
}

export function BarcodeScanner({ onSelect, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [manual, setManual] = useState("");
  const [result, setResult] = useState<FoodSearchResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(false);
  const [isPending, startTransition] = useTransition();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  // Stop camera stream on close or unmount
  useEffect(() => {
    return () => stopCamera();
  }, []);

  function stopCamera() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
  }

  function reset() {
    setManual("");
    setResult(null);
    setNotFound(false);
    setError(null);
    setDetected(false);
  }

  function close() {
    stopCamera();
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

  async function startCamera() {
    reset();
    setError(null);

    // Polyfill BarcodeDetector for browsers that don't support it natively (e.g. iOS Safari/Chrome)
    if (!("BarcodeDetector" in window)) {
      try {
        const { BarcodeDetector } = await import("barcode-detector/pure");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).BarcodeDetector = BarcodeDetector;
      } catch {
        setError("Live scanning not supported in this browser. Enter the barcode number manually.");
        return;
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      scanLoop();
    } catch {
      setError("Camera permission denied. Enter the barcode number manually.");
    }
  }

  function scanLoop() {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const detector = new (window as any).BarcodeDetector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
    });

    function tick() {
      if (!streamRef.current || !video || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      detector
        .detect(video)
        .then((barcodes: { rawValue: string }[]) => {
          if (barcodes.length > 0) {
            setDetected(true);
            stopCamera();
            lookup(barcodes[0].rawValue);
          } else {
            rafRef.current = requestAnimationFrame(tick);
          }
        })
        .catch(() => {
          rafRef.current = requestAnimationFrame(tick);
        });
    }

    rafRef.current = requestAnimationFrame(tick);
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (manual.trim()) {
      stopCamera();
      lookup(manual.trim());
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); }}
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
          <p className="text-sm font-semibold">Barcode Scanner</p>
        </div>
        <button type="button" onClick={close} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      {/* Live video viewfinder — always in DOM so ref is valid before scanning starts */}
      <div className={`relative overflow-hidden rounded-lg bg-black aspect-video w-full ${scanning ? "" : "hidden"}`}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
          {/* Scanning overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative h-40 w-64">
              {/* Corner brackets */}
              <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-amber-400" />
              <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-amber-400" />
              <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-amber-400" />
              <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-amber-400" />
            </div>
          </div>
          <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80">
            Point camera at barcode — auto-detects
          </p>
      </div>

      {/* Start camera button (before scanning starts) */}
      {!scanning && !detected && !isPending && !result && (
        <button
          type="button"
          onClick={startCamera}
          className="flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700"
        >
          <Camera className="size-4" />
          Open Camera
        </button>
      )}

      {/* Detecting spinner */}
      {(detected || isPending) && !result && !notFound && !error && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Looking up barcode…
        </div>
      )}

      {/* Manual entry */}
      {!scanning && (
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Enter barcode number manually"
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
      )}

      {/* States */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle className="size-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
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
