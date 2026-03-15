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
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors placeholder:text-muted-foreground";
const selectClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors";
const labelClass = "block text-xs font-medium text-muted-foreground mb-1";
const errorClass = "mt-1 text-xs text-rose-500";

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

        {/* Food name + meal type */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
