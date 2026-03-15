"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { setMacroTargets } from "@/actions/diet-actions";
import { Button } from "@/components/ui/button";
import type { MacroTarget } from "@/types";

const schema = z.object({
  calories: z.number().min(500, "Min 500").max(10000, "Max 10000"),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(2000),
  fat: z.number().min(0).max(1000),
});

type FormData = z.infer<typeof schema>;

interface Props {
  currentTargets: MacroTarget | null;
  onClose: () => void;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground mb-1";
const errorClass = "mt-1 text-xs text-rose-500";

export function MacroTargetForm({ currentTargets, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: currentTargets
      ? {
          calories: currentTargets.calories,
          protein: currentTargets.protein,
          carbs: currentTargets.carbs,
          fat: currentTargets.fat,
        }
      : {
          calories: 2500,
          protein: 180,
          carbs: 280,
          fat: 70,
        },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      await setMacroTargets(data);
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-up">
      <div className="mb-1">
        <h3 className="text-sm font-semibold">Daily Macro Targets</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Set your daily nutrition goals.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Calories (kcal)</label>
            <input {...register("calories", { valueAsNumber: true })} type="number" min={0} className={inputClass} />
            {errors.calories && <p className={errorClass}>{errors.calories.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Protein (g)</label>
            <input {...register("protein", { valueAsNumber: true })} type="number" min={0} className={inputClass} />
            {errors.protein && <p className={errorClass}>{errors.protein.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Carbs (g)</label>
            <input {...register("carbs", { valueAsNumber: true })} type="number" min={0} className={inputClass} />
            {errors.carbs && <p className={errorClass}>{errors.carbs.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Fat (g)</label>
            <input {...register("fat", { valueAsNumber: true })} type="number" min={0} className={inputClass} />
            {errors.fat && <p className={errorClass}>{errors.fat.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving…" : "Save Targets"}
          </Button>
        </div>
      </form>
    </div>
  );
}
