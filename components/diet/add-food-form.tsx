"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { addDietEntry, updateDietEntry } from "@/actions/diet-actions";
import { Button } from "@/components/ui/button";
import { MEAL_TYPES } from "@/types";
import type { DietEntry, MealType } from "@/types";

const schema = z.object({
  food: z.string().min(1, "Food name required"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.number().min(0).max(9999),
  protein: z.number().min(0).max(999),
  carbs: z.number().min(0).max(999),
  fat: z.number().min(0).max(999),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  date: string;
  defaultMealType?: MealType;
  editingEntry?: DietEntry;
  onClose: () => void;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors placeholder:text-muted-foreground";
const selectClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground mb-1";
const errorClass = "mt-1 text-xs text-rose-500";

export function AddFoodForm({ date, defaultMealType = "breakfast", editingEntry, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditing = !!editingEntry;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: editingEntry
      ? {
          food: editingEntry.food,
          mealType: editingEntry.mealType,
          calories: editingEntry.calories,
          protein: editingEntry.protein,
          carbs: editingEntry.carbs,
          fat: editingEntry.fat,
          notes: editingEntry.notes ?? "",
        }
      : {
          mealType: defaultMealType,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
  });

  function onSubmit(data: FormData) {
    startTransition(async () => {
      if (isEditing && editingEntry) {
        await updateDietEntry(editingEntry.id, data);
      } else {
        await addDietEntry({ ...data, date });
      }
      router.refresh();
      onClose();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-up">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{isEditing ? "Edit Food" : "Add Food"}</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Food name + meal type */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Food name</label>
            <input
              {...register("food")}
              placeholder="e.g. Chicken breast"
              className={inputClass}
              autoFocus
            />
            {errors.food && <p className={errorClass}>{errors.food.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Meal</label>
            <select {...register("mealType")} className={selectClass}>
              {MEAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Macros row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className={labelClass}>Calories</label>
            <input
              {...register("calories", { valueAsNumber: true })}
              type="number"
              min={0}
              placeholder="0"
              className={inputClass}
            />
            {errors.calories && <p className={errorClass}>{errors.calories.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Protein (g)</label>
            <input
              {...register("protein", { valueAsNumber: true })}
              type="number"
              min={0}
              placeholder="0"
              className={inputClass}
            />
            {errors.protein && <p className={errorClass}>{errors.protein.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Carbs (g)</label>
            <input
              {...register("carbs", { valueAsNumber: true })}
              type="number"
              min={0}
              placeholder="0"
              className={inputClass}
            />
            {errors.carbs && <p className={errorClass}>{errors.carbs.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Fat (g)</label>
            <input
              {...register("fat", { valueAsNumber: true })}
              type="number"
              min={0}
              placeholder="0"
              className={inputClass}
            />
            {errors.fat && <p className={errorClass}>{errors.fat.message}</p>}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>Notes (optional)</label>
          <input
            {...register("notes")}
            placeholder="e.g. 200g cooked"
            className={inputClass}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? "Saving…" : isEditing ? "Save Changes" : "Add Food"}
          </Button>
        </div>
      </form>
    </div>
  );
}
