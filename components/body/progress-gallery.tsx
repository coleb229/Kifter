"use client";

import { useState, useTransition, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { Trash2, X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { UploadButton } from "@/lib/uploadthing-client";
import { addProgressPhoto, deleteProgressPhoto } from "@/actions/progress-photo-actions";
import type { ProgressPhoto } from "@/types";

interface Props {
  initialPhotos: ProgressPhoto[];
}

export function ProgressGallery({ initialPhotos }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [uploadDate, setUploadDate] = useState("");
  useEffect(() => { setUploadDate(new Date().toISOString().slice(0, 10)); }, []);
  const [uploadNotes, setUploadNotes] = useState("");
  const photos = initialPhotos;

  function handleConfirmDelete(id: string) {
    setConfirmingId(id);
    setTimeout(() => setConfirmingId((prev) => (prev === id ? null : prev)), 3000);
  }

  function handleDelete(id: string) {
    setConfirmingId(null);
    startTransition(async () => {
      await deleteProgressPhoto(id);
      router.refresh();
    });
  }

  const handleLightboxKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setLightboxIndex(null);
    else if (e.key === "ArrowLeft" && lightboxIndex !== null && lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1);
    else if (e.key === "ArrowRight" && lightboxIndex !== null && lightboxIndex < photos.length - 1) setLightboxIndex(lightboxIndex + 1);
  }, [lightboxIndex, photos.length]);

  useEffect(() => {
    if (lightboxIndex !== null) dialogRef.current?.focus();
  }, [lightboxIndex]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Progress Photos</h2>
          <p className="text-xs text-muted-foreground">Private — only visible to you</p>
        </div>
      </div>

      {/* Upload controls */}
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-5">
        <div>
          <label htmlFor="photo-date" className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
          <input
            id="photo-date"
            type="date"
            value={uploadDate}
            onChange={(e) => setUploadDate(e.target.value)}
            suppressHydrationWarning
            className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label htmlFor="photo-notes" className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
          <input
            id="photo-notes"
            type="text"
            value={uploadNotes}
            onChange={(e) => setUploadNotes(e.target.value)}
            placeholder="e.g. Front pose, 12 weeks out"
            className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <UploadButton
          endpoint="progressPhoto"
          onClientUploadComplete={(res) => {
            const url = res[0]?.url;
            if (!url) return;
            startTransition(async () => {
              await addProgressPhoto(url, uploadDate, uploadNotes || undefined);
              setUploadNotes("");
              router.refresh();
            });
          }}
          appearance={{
            button: "ut-ready:bg-primary ut-ready:text-primary-foreground ut-uploading:bg-primary/70 rounded-lg px-4 h-9 text-sm font-medium",
            allowedContent: "hidden",
          }}
        />
      </div>

      {/* Grid */}
      {photos.length === 0 ? (
        <EmptyState
          icon={Camera}
          title="No photos yet"
          description="Upload a progress photo above to get started."
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-border bg-muted"
              onClick={() => setLightboxIndex(i)}
            >
              <Image
                src={photo.photoUrl}
                alt={`Progress photo ${photo.date}`}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {/* Date overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4">
                <p className="text-[11px] font-medium text-white">
                  {format(new Date(photo.date + "T00:00:00"), "MMM d, yyyy")}
                </p>
              </div>
              {/* Delete button */}
              {confirmingId === photo.id ? (
                <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/70 px-2 py-1" aria-live="polite" onClick={(e) => e.stopPropagation()}>
                  <button type="button" onClick={() => handleDelete(photo.id)} disabled={isPending}
                    className="text-[10px] font-medium text-destructive hover:underline">
                    {isPending ? "…" : "Delete?"}
                  </button>
                  <button type="button" onClick={() => setConfirmingId(null)}
                    className="text-[10px] text-white/70 hover:text-white">Cancel</button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleConfirmDelete(photo.id); }}
                  disabled={isPending}
                  className="absolute right-1.5 top-1.5 hidden rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-destructive group-hover:flex"
                  aria-label="Delete photo"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Photo lightbox"
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 outline-none"
          onClick={() => setLightboxIndex(null)}
          onKeyDown={handleLightboxKeyDown}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setLightboxIndex(null)}
            aria-label="Close"
          >
            <X className="size-5" />
          </button>

          {lightboxIndex > 0 && (
            <button
              className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              aria-label="Previous"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[lightboxIndex].photoUrl}
            alt="Progress"
            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {lightboxIndex < photos.length - 1 && (
            <button
              className="absolute right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              aria-label="Next"
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          <p className="absolute bottom-4 text-sm text-white/70 truncate max-w-md px-4">
            {format(new Date(photos[lightboxIndex].date + "T00:00:00"), "MMMM d, yyyy")}
            {photos[lightboxIndex].notes && ` · ${photos[lightboxIndex].notes}`}
          </p>
        </div>
      )}
    </div>
  );
}
