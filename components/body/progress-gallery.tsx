"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2, X, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing-client";
import { addProgressPhoto, deleteProgressPhoto } from "@/actions/progress-photo-actions";
import type { ProgressPhoto } from "@/types";

interface Props {
  initialPhotos: ProgressPhoto[];
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function ProgressGallery({ initialPhotos }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadDate, setUploadDate] = useState(todayStr());
  const [uploadNotes, setUploadNotes] = useState("");
  const photos = initialPhotos;

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteProgressPhoto(id);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Progress Photos</h2>
          <p className="text-xs text-muted-foreground">Private — only visible to you</p>
        </div>
      </div>

      {/* Upload controls */}
      <div className="mb-5 flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Date</label>
          <input
            type="date"
            value={uploadDate}
            onChange={(e) => setUploadDate(e.target.value)}
            className="h-10 min-w-0 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
          <input
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
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Camera className="mx-auto mb-3 size-8 text-muted-foreground" />
          <p className="text-sm font-medium">No photos yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Upload a progress photo above to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, i) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-border bg-muted"
              onClick={() => setLightboxIndex(i)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.photoUrl}
                alt={`Progress photo ${photo.date}`}
                className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {/* Date overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-2 pb-1.5 pt-4">
                <p className="text-[11px] font-medium text-white">
                  {format(new Date(photo.date + "T00:00:00"), "MMM d, yyyy")}
                </p>
              </div>
              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDelete(photo.id); }}
                disabled={isPending}
                className="absolute right-1.5 top-1.5 hidden rounded-full bg-black/50 p-1 text-white transition-colors hover:bg-destructive group-hover:flex"
                aria-label="Delete photo"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setLightboxIndex(null)}
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

          <p className="absolute bottom-4 text-sm text-white/70">
            {format(new Date(photos[lightboxIndex].date + "T00:00:00"), "MMMM d, yyyy")}
            {photos[lightboxIndex].notes && ` · ${photos[lightboxIndex].notes}`}
          </p>
        </div>
      )}
    </div>
  );
}
