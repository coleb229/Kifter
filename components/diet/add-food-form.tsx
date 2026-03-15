"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { addDietEntry, updateDietEntry } from "@/actions/diet-actions";
import { submitCommunityFood } from "@/actions/food-actions";
import { FoodSearch } from "@/components/diet/food-search";
import { Button } from "@/components/ui/button";
import { MEAL_TYPES } from "@/types";
import type { FoodSearchResult } from "@/actions/food-actions";
import type { DietEntry, MealType } from "@/types";

const schema = z.object({
  food: z.string().min(1, "Food name required"),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  calories: z.number().min(0).max(9999),
  protein: z.number().min(0).max(999),
  carbs: z.number().min(0).max(999),
  fat: z.number().min(0).max(999),
  servingSize: z.number().min(0.1).max(9999),
  servingUnit: z.string().min(1),
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
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors placeholder:text-muted-foreground";
const labelClass = "block text-xs font-medium text-muted-foreground mb-1";
const errorClass = "mt-1 text-xs text-rose-500";

const MEAL_TYPE_STYLES: Record<string, { active: string; inactive: string }> = {
  breakfast: { active: "bg-amber-500 border-amber-500 text-white",   inactive: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40" },
  lunch:     { active: "bg-emerald-500 border-emerald-500 text-white", inactive: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40" },
  dinner:    { active: "bg-indigo-500 border-indigo-500 text-white",  inactive: "border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40" },
  snack:     { active: "bg-orange-500 border-orange-500 text-white",  inactive: "border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/40" },
};

const MACRO_LABELS: Record<string, { label: string; color: string }> = {
  calories: { label: "Calories",   color: "text-amber-600 dark:text-amber-400" },
  protein:  { label: "Protein (g)", color: "text-emerald-600 dark:text-emerald-400" },
  carbs:    { label: "Carbs (g)",   color: "text-sky-600 dark:text-sky-400" },
  fat:      { label: "Fat (g)",     color: "text-orange-600 dark:text-orange-400" },
};

export function AddFoodForm({ date, defaultMealType = "breakfast", editingEntry, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFromSearch, setSelectedFromSearch] = useState(false);
  const isEditing = !!editingEntry;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
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
          servingSize: 1,
          servingUnit: "serving",
          notes: editingEntry.notes ?? "",
        }
      : {
          mealType: defaultMealType,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          servingSize: 1,
          servingUnit: "serving",
        },
  });

  const foodName = watch("food");

  function handleFoodSelect(food: FoodSearchResult) {
    setValue("food", food.name, { shouldValidate: true });
    setValue("calories", food.calories);
    setValue("protein", food.protein);
    setValue("carbs", food.carbs);
    setValue("fat", food.fat);
    setValue("servingSize", food.servingSize);
    setValue("servingUnit", food.servingUnit);
    setSelectedFromSearch(true);
    setSaveToLibrary(false); // already in library
  }

  // When user manually types a food name (not from search), offer save-to-library
  function handleFoodNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFromSearch(false);
    setValue("food", e.target.value, { shouldValidate: true });
  }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      if (isEditing && editingEntry) {
        await updateDietEntry(editingEntry.id, {
          mealType: data.mealType,
          food: data.food,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          notes: data.notes,
        });
      } else {
        await addDietEntry({
          date,
          mealType: data.mealType,
          food: data.food,
          calories: data.calories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          notes: data.notes,
        });

        // Optionally save to community food library
        if (saveToLibrary) {
          await submitCommunityFood({
            name: data.food,
            calories: data.calories,
            protein: data.protein,
            carbs: data.carbs,
            fat: data.fat,
            servingSize: data.servingSize,
            servingUnit: data.servingUnit,
          });
        }
      }

      router.refresh();
      onClose();
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-up">
      {/* Header */}
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
        {/* Food search (only when adding, not editing) */}
        {!isEditing && (
          <div>
            <label className={labelClass}>Search food library</label>
            <FoodSearch onSelect={handleFoodSelect} />
            <p className="mt-1 text-[11px] text-muted-foreground">
              Select from library to auto-fill macros, or enter a custom food below.
            </p>
          </div>
        )}

        {/* Food name */}
        <div>
          <label className={labelClass}>Food name</label>
          <input
            value={foodName ?? ""}
            onChange={handleFoodNameChange}
            placeholder="e.g. Chicken breast"
            className={inputClass}
          />
          {errors.food && <p className={errorClass}>{errors.food.message}</p>}
        </div>

        {/* Meal type — colored pills */}
        <div>
          <label className={labelClass}>Meal</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((t) => {
              const styles = MEAL_TYPE_STYLES[t];
              const isSelected = watch("mealType") === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValue("mealType", t, { shouldValidate: true })}
                  className={`rounded-full border px-3.5 py-1 text-sm font-medium capitalize transition-colors ${
                    isSelected ? styles.active : styles.inactive
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Macros row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["calories", "protein", "carbs", "fat"] as const).map((field) => (
            <div key={field}>
              <label className={`${labelClass} ${MACRO_LABELS[field].color}`}>
                {MACRO_LABELS[field].label}
              </label>
              <input
                {...register(field, { valueAsNumber: true })}
                type="number"
                min={0}
                placeholder="0"
                className={inputClass}
              />
              {errors[field] && <p className={errorClass}>{errors[field]!.message}</p>}
            </div>
          ))}
        </div>

        {/* Advanced (serving + notes) — collapsible */}
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {showAdvanced ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          {showAdvanced ? "Hide" : "Serving size & notes"}
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClass}>Serving size</label>
              <input
                {...register("servingSize", { valueAsNumber: true })}
                type="number"
                min={0.1}
                step={0.1}
                placeholder="1"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Unit</label>
              <input
                {...register("servingUnit")}
                placeholder="g / oz / cup / piece"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Notes (optional)</label>
              <input
                {...register("notes")}
                placeholder="e.g. 200g cooked"
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Save to community library (only for new, manually-entered foods) */}
        {!isEditing && !selectedFromSearch && (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50">
            <input
              type="checkbox"
              checked={saveToLibrary}
              onChange={(e) => setSaveToLibrary(e.target.checked)}
              className="size-3.5 accent-emerald-500"
            />
            <div>
              <p className="text-xs font-medium">Save to community food library</p>
              <p className="text-[10px] text-muted-foreground">
                Share this food with all Kifted users so they can find it too.
              </p>
            </div>
          </label>
        )}

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
