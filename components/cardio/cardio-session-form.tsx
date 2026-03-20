"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { addCardioSession, updateCardioSession } from "@/actions/cardio-actions";
import { Button } from "@/components/ui/button";
import { CARDIO_ACTIVITIES, CARDIO_INTENSITIES } from "@/types";
import type { CardioSession, CardioIntensity } from "@/types";
import { useFormPersistence } from "@/hooks/use-form-persistence";

const INTENSITY_STYLES: Record<CardioIntensity, { active: string; inactive: string }> = {
  easy:     { active: "bg-emerald-500 border-emerald-500 text-white",  inactive: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40" },
  moderate: { active: "bg-amber-500 border-amber-500 text-white",      inactive: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40" },
  hard:     { active: "bg-orange-500 border-orange-500 text-white",    inactive: "border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/40" },
  max:      { active: "bg-rose-500 border-rose-500 text-white",        inactive: "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40" },
};

const schema = z.object({
  date: z.string().min(1, "Date required"),
  activityType: z.enum(CARDIO_ACTIVITIES),
  duration: z.number().min(1, "At least 1 minute").max(1440),
  distance: z.number().min(0.01).max(9999).optional(),
  distanceUnit: z.enum(["km", "mi"]),
  intensity: z.enum(CARDIO_INTENSITIES),
  caloriesBurned: z.number().min(1).max(9999).optional(),
  avgHeartRate: z.number().min(30).max(300).optional(),
  notes: z.string().optional(),
});

const toOptionalNumber = (v: string) =>
  v === "" || v === undefined ? undefined : parseFloat(v);

type FormData = z.infer<typeof schema>;

const inputClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-colors placeholder:text-muted-foreground";
const selectClass =
  "h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground mb-1";
const errorClass = "mt-1 text-xs text-rose-500";

interface Props {
  editingSession?: CardioSession;
}

export function CardioSessionForm({ editingSession }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingSession;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editingSession
      ? {
          date: format(new Date(editingSession.date), "yyyy-MM-dd"),
          activityType: editingSession.activityType,
          duration: editingSession.duration,
          distance: editingSession.distance,
          distanceUnit: editingSession.distanceUnit ?? "km",
          intensity: editingSession.intensity,
          caloriesBurned: editingSession.caloriesBurned,
          avgHeartRate: editingSession.avgHeartRate,
          notes: editingSession.notes ?? "",
        }
      : {
          date: format(new Date(), "yyyy-MM-dd"),
          activityType: "Run",
          duration: 30,
          distanceUnit: "km",
          intensity: "moderate",
        },
  });

  const values = watch();
  // Only cache for new sessions, not edits (edits already have a source of truth)
  const { isDraftSaved, clearDraft } = useFormPersistence({
    key: "cardio-session-form",
    values: values as Record<string, unknown>,
    reset: reset as (v: Partial<Record<string, unknown>>) => void,
    exclude: ["date"],
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      if (isEditing && editingSession) {
        await updateCardioSession(editingSession.id, {
          date: data.date,
          activityType: data.activityType,
          duration: data.duration,
          distance: data.distance,
          distanceUnit: data.distanceUnit,
          intensity: data.intensity,
          caloriesBurned: data.caloriesBurned,
          avgHeartRate: data.avgHeartRate,
          notes: data.notes,
        });
        router.refresh();
      } else {
        clearDraft();
        await addCardioSession({
          date: data.date,
          activityType: data.activityType,
          duration: data.duration,
          distance: data.distance,
          distanceUnit: data.distanceUnit,
          intensity: data.intensity,
          caloriesBurned: data.caloriesBurned,
          avgHeartRate: data.avgHeartRate,
          notes: data.notes,
        });
        router.push("/cardio");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5"
    >
      {/* Row 1: date + activity */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Date</label>
          <input {...register("date")} type="date" className={inputClass} />
          {errors.date && <p className={errorClass}>{errors.date.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Activity</label>
          <select {...register("activityType")} className={selectClass}>
            {CARDIO_ACTIVITIES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: duration + intensity */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Duration (minutes)</label>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {[15, 20, 30, 45, 60, 90].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setValue("duration", d, { shouldValidate: true })}
                className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  watch("duration") === d
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {d}m
              </button>
            ))}
          </div>
          <input
            {...register("duration", { valueAsNumber: true })}
            type="number"
            min={1}
            max={1440}
            placeholder="30"
            className={inputClass}
          />
          {errors.duration && <p className={errorClass}>{errors.duration.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Intensity</label>
          <div className="flex flex-wrap gap-2">
            {CARDIO_INTENSITIES.map((level) => {
              const styles = INTENSITY_STYLES[level];
              const isSelected = watch("intensity") === level;
              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setValue("intensity", level, { shouldValidate: true })}
                  className={`flex-1 rounded-full border px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
                    isSelected ? styles.active : styles.inactive
                  }`}
                >
                  {level}
                </button>
              );
            })}
          </div>
          {errors.intensity && <p className={errorClass}>{errors.intensity.message}</p>}
        </div>
      </div>

      {/* Row 3: distance + unit */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Distance (optional)</label>
          <input
            {...register("distance", { setValueAs: toOptionalNumber })}
            type="number"
            min={0}
            step={0.01}
            placeholder="e.g. 5.0"
            className={inputClass}
          />
          {errors.distance && <p className={errorClass}>{errors.distance.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Unit</label>
          <select {...register("distanceUnit")} className={selectClass}>
            <option value="km">km</option>
            <option value="mi">mi</option>
          </select>
        </div>
      </div>

      {/* Row 4: calories + heart rate */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Calories burned (optional)</label>
          <input
            {...register("caloriesBurned", { setValueAs: toOptionalNumber })}
            type="number"
            min={0}
            placeholder="e.g. 320"
            className={inputClass}
          />
          {errors.caloriesBurned && <p className={errorClass}>{errors.caloriesBurned.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Avg heart rate bpm (optional)</label>
          <input
            {...register("avgHeartRate", { setValueAs: toOptionalNumber })}
            type="number"
            min={30}
            max={300}
            placeholder="e.g. 145"
            className={inputClass}
          />
          {errors.avgHeartRate && <p className={errorClass}>{errors.avgHeartRate.message}</p>}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className={labelClass}>Notes (optional)</label>
        <input
          {...register("notes")}
          placeholder="e.g. Morning run, felt strong"
          className={inputClass}
        />
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        {!isEditing && isDraftSaved ? (
          <span className="text-xs text-muted-foreground animate-in fade-in">Draft saved</span>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving…" : isEditing ? "Save Changes" : "Log Session"}
          </Button>
        </div>
      </div>
    </form>
  );
}
