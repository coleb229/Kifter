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
import type { CardioSession } from "@/types";

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
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-colors placeholder:text-muted-foreground";
const selectClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-colors";
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
          <select {...register("intensity")} className={selectClass}>
            {CARDIO_INTENSITIES.map((i) => (
              <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
            ))}
          </select>
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

      <div className="flex justify-end gap-2 pt-1">
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
    </form>
  );
}
