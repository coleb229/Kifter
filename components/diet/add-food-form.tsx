"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, ChevronDown, ChevronUp, Mic, MicOff, Zap } from "lucide-react";
import { addDietEntry, updateDietEntry } from "@/actions/diet-actions";
import { submitCommunityFood, searchFoods, getFavoriteFoods, addFavoriteFood, removeFavoriteFood } from "@/actions/food-actions";
import { FoodSearch } from "@/components/diet/food-search";
import { BarcodeScanner } from "@/components/diet/barcode-scanner";
import { Button } from "@/components/ui/button";
import { MEAL_TYPES } from "@/types";
import { MEAL_TYPE_STYLES } from "@/lib/label-colors";
import type { FoodSearchResult } from "@/actions/food-actions";
import type { DietEntry, FavoriteFood, MealType } from "@/types";

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
  onClose: (saved?: boolean) => void;
}

const labelClass = "block text-xs font-medium text-muted-foreground mb-1";
const errorClass = "mt-1 text-xs text-rose-500";

const MACRO_LABELS: Record<string, { label: string; color: string }> = {
  calories: { label: "Calories",   color: "text-amber-600 dark:text-amber-400" },
  protein:  { label: "Protein (g)", color: "text-emerald-600 dark:text-emerald-400" },
  carbs:    { label: "Carbs (g)",   color: "text-sky-600 dark:text-sky-400" },
  fat:      { label: "Fat (g)",     color: "text-orange-600 dark:text-orange-400" },
};

const MULTIPLIERS = [0.5, 1, 1.5, 2, 3];

// Gram estimator reference chips by food category
const GRAM_ESTIMATORS: Record<string, { label: string; grams: number }[]> = {
  "Protein": [
    { label: "palm ~85g", grams: 85 },
    { label: "deck of cards ~90g", grams: 90 },
    { label: "fist ~120g", grams: 120 },
  ],
  "Grains & Bread": [
    { label: "cupped hand ~40g", grams: 40 },
    { label: "tennis ball ~80g", grams: 80 },
  ],
  "Fruits": [
    { label: "tennis ball ~150g", grams: 150 },
    { label: "fist ~120g", grams: 120 },
  ],
  "Vegetables": [
    { label: "fist ~80g", grams: 80 },
    { label: "two handfuls ~60g", grams: 60 },
  ],
  "Nuts & Seeds": [
    { label: "thumb ~15g", grams: 15 },
    { label: "small handful ~30g", grams: 30 },
  ],
  "Dairy & Eggs": [
    { label: "golf ball ~30g", grams: 30 },
    { label: "deck of cards ~60g", grams: 60 },
  ],
};

// Macro stepper component
function MacroStepper({
  value,
  onChange,
  max = 9999,
  colorClass,
}: {
  value: number;
  onChange: (v: number) => void;
  max?: number;
  colorClass: string;
}) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startRepeat(delta: number) {
    let current = value;
    onChange(Math.max(0, Math.min(max, current + delta)));
    current = Math.max(0, Math.min(max, current + delta));
    intervalRef.current = setInterval(() => {
      current = Math.max(0, Math.min(max, current + delta));
      onChange(current);
    }, 120);
  }

  function stopRepeat() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  useEffect(() => () => stopRepeat(), []);

  return (
    <div className="flex items-center rounded-lg border border-border overflow-hidden">
      <button
        type="button"
        onPointerDown={() => startRepeat(-1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        className="flex h-10 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted select-none touch-none"
      >
        −
      </button>
      <input
        type="number"
        value={value}
        min={0}
        max={max}
        step={0.1}
        onChange={(e) => {
          const n = parseFloat(e.target.value);
          if (!isNaN(n)) onChange(Math.max(0, Math.min(max, n)));
        }}
        className={`h-10 w-full min-w-0 bg-background text-center text-sm font-medium outline-none focus:ring-1 focus:ring-inset focus:ring-amber-500/40 ${colorClass}`}
      />
      <button
        type="button"
        onPointerDown={() => startRepeat(1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
        className="flex h-10 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:bg-muted select-none touch-none"
      >
        +
      </button>
    </div>
  );
}

export function AddFoodForm({ date, defaultMealType = "breakfast", editingEntry, onClose }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveToLibrary, setSaveToLibrary] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(!editingEntry);
  const [selectedFromSearch, setSelectedFromSearch] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [activeMultiplier, setActiveMultiplier] = useState(1);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [caloriesOnly, setCaloriesOnly] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("kifted-calories-only-mode") === "true";
    }
    return false;
  });
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const isEditing = !!editingEntry;

  const {
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
          servingSize: editingEntry.servingSize ?? 1,
          servingUnit: editingEntry.servingUnit ?? "serving",
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
  const calories = watch("calories") ?? 0;
  const protein = watch("protein") ?? 0;
  const carbs = watch("carbs") ?? 0;
  const fat = watch("fat") ?? 0;

  // Load favorites on mount
  useEffect(() => {
    getFavoriteFoods().then((res) => {
      if (res.success) setFavorites(res.data);
    });
  }, []);

  function handleFoodSelect(food: FoodSearchResult) {
    setValue("food", food.name, { shouldValidate: true });
    setValue("calories", food.calories);
    setValue("protein", food.protein);
    setValue("carbs", food.carbs);
    setValue("fat", food.fat);
    setValue("servingSize", food.servingSize);
    setValue("servingUnit", food.servingUnit);
    setSelectedFood(food);
    setActiveMultiplier(1);
    setCustomAmount(String(food.servingSize));
    setSelectedFromSearch(true);
  }

  function handleFoodNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFromSearch(false);
    setSelectedFood(null);
    setActiveMultiplier(1);
    setValue("food", e.target.value, { shouldValidate: true });
  }

  function applyMultiplier(mult: number) {
    if (!selectedFood) return;
    setActiveMultiplier(mult);
    setCustomAmount(String(Math.round(selectedFood.servingSize * mult * 10) / 10));
    setValue("calories", Math.round(selectedFood.calories * mult));
    setValue("protein", Math.round(selectedFood.protein * mult * 10) / 10);
    setValue("carbs", Math.round(selectedFood.carbs * mult * 10) / 10);
    setValue("fat", Math.round(selectedFood.fat * mult * 10) / 10);
  }

  function applyCustomAmount(amountStr: string) {
    const amount = parseFloat(amountStr);
    if (!selectedFood || isNaN(amount) || amount <= 0 || selectedFood.servingSize <= 0) return;
    const factor = amount / selectedFood.servingSize;
    setActiveMultiplier(-1); // deselect preset buttons
    setValue("servingSize", amount);
    setValue("calories", Math.round(selectedFood.calories * factor));
    setValue("protein", Math.round(selectedFood.protein * factor * 10) / 10);
    setValue("carbs", Math.round(selectedFood.carbs * factor * 10) / 10);
    setValue("fat", Math.round(selectedFood.fat * factor * 10) / 10);
  }

  function handleGramChip(grams: number) {
    setValue("servingSize", grams);
    setShowAdvanced(true);
    // Scale macros by grams relative to selected food's serving size
    if (selectedFood && selectedFood.servingSize > 0) {
      const factor = grams / selectedFood.servingSize;
      setValue("calories", Math.round(selectedFood.calories * factor));
      setValue("protein", Math.round(selectedFood.protein * factor * 10) / 10);
      setValue("carbs", Math.round(selectedFood.carbs * factor * 10) / 10);
      setValue("fat", Math.round(selectedFood.fat * factor * 10) / 10);
    }
  }

  function toggleCaloriesOnly() {
    const next = !caloriesOnly;
    setCaloriesOnly(next);
    localStorage.setItem("kifted-calories-only-mode", String(next));
    if (next) {
      setValue("protein", 0);
      setValue("carbs", 0);
      setValue("fat", 0);
    }
  }

  const startVoice = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceError("Voice input not supported in this browser.");
      return;
    }
    setVoiceError(null);
    const recognition = new SpeechRec();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setVoiceListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      setVoiceListening(false);

      // Parse: "200 grams chicken breast for lunch"
      const gramsMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:grams?|g\b)/);
      const ozMatch = transcript.match(/(\d+(?:\.\d+)?)\s*(?:ounces?|oz\b)/);
      const mealMatch = transcript.match(/\b(breakfast|lunch|dinner|snack)\b/);
      const calMatch = transcript.match(/(\d+)\s*(?:calories?|kcal)/);

      // Extract food name: remove quantity/unit/meal keywords
      let query = transcript
        .replace(/\d+(?:\.\d+)?\s*(?:grams?|g\b|ounces?|oz\b|calories?|kcal)\b/g, "")
        .replace(/\b(?:for\s+)?(breakfast|lunch|dinner|snack)\b/g, "")
        .replace(/\b(for|of|the|a|an|some)\b/g, "")
        .replace(/\s+/g, " ")
        .trim();

      if (mealMatch) {
        setValue("mealType", mealMatch[1] as MealType, { shouldValidate: true });
      }

      if (calMatch && !query) {
        setValue("calories", parseInt(calMatch[1]));
        return;
      }

      if (query) {
        setValue("food", query, { shouldValidate: true });
        // Try to find a matching food
        const res = await searchFoods(query);
        if (res.success && res.data.length > 0) {
          const match = res.data[0];
          handleFoodSelect(match);

          // Apply gram quantity if provided
          const grams = gramsMatch ? parseFloat(gramsMatch[1]) : ozMatch ? parseFloat(ozMatch[1]) * 28.35 : null;
          if (grams && match.servingSize > 0) {
            const factor = grams / match.servingSize;
            setValue("calories", Math.round(match.calories * factor));
            setValue("protein", Math.round(match.protein * factor * 10) / 10);
            setValue("carbs", Math.round(match.carbs * factor * 10) / 10);
            setValue("fat", Math.round(match.fat * factor * 10) / 10);
            setValue("servingSize", grams);
          }
        } else if (calMatch) {
          setValue("calories", parseInt(calMatch[1]));
        }
      }
    };

    recognition.onerror = () => {
      setVoiceListening(false);
      setVoiceError("Could not hear you. Try again.");
    };
    recognition.onend = () => setVoiceListening(false);
    recognition.start();
  }, [setValue]);

  function stopVoice() {
    recognitionRef.current?.stop();
    setVoiceListening(false);
  }

  async function handleToggleFavorite(food: FoodSearchResult) {
    const isFav = favorites.some((f) => f.name.toLowerCase() === food.name.toLowerCase());
    if (isFav) {
      await removeFavoriteFood(food.name);
      setFavorites((prev) => prev.filter((f) => f.name.toLowerCase() !== food.name.toLowerCase()));
    } else {
      await addFavoriteFood(food);
      const res = await getFavoriteFoods();
      if (res.success) setFavorites(res.data);
    }
  }

  function onSubmit(data: FormData) {
    startTransition(async () => {
      // Apply servings multiplier for manually-typed foods (library foods already have it applied via applyMultiplier)
      const mult = !selectedFood && activeMultiplier !== 1 ? activeMultiplier : 1;
      const multiplied = mult !== 1
        ? {
            ...data,
            calories: Math.round(data.calories * mult),
            protein: Math.round(data.protein * mult * 10) / 10,
            carbs: Math.round(data.carbs * mult * 10) / 10,
            fat: Math.round(data.fat * mult * 10) / 10,
          }
        : data;

      const submitData = caloriesOnly
        ? { ...multiplied, protein: 0, carbs: 0, fat: 0 }
        : multiplied;

      if (isEditing && editingEntry) {
        await updateDietEntry(editingEntry.id, {
          mealType: submitData.mealType,
          food: submitData.food,
          calories: submitData.calories,
          protein: submitData.protein,
          carbs: submitData.carbs,
          fat: submitData.fat,
          servingSize: submitData.servingSize,
          servingUnit: submitData.servingUnit,
          notes: submitData.notes,
        });
      } else {
        await addDietEntry({
          date,
          mealType: submitData.mealType,
          food: submitData.food,
          calories: submitData.calories,
          protein: submitData.protein,
          carbs: submitData.carbs,
          fat: submitData.fat,
          servingSize: submitData.servingSize,
          servingUnit: submitData.servingUnit,
          notes: submitData.notes,
        });

        if (saveToLibrary) {
          await submitCommunityFood({
            name: submitData.food,
            calories: submitData.calories,
            protein: submitData.protein,
            carbs: submitData.carbs,
            fat: submitData.fat,
            servingSize: submitData.servingSize,
            servingUnit: submitData.servingUnit,
          });
        }
      }

      router.refresh();
      onClose(true);
    });
  }

  const hasSpeechAPI =
    typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ("SpeechRecognition" in (window as any) || "webkitSpeechRecognition" in (window as any));

  const gramEstimators = selectedFood?.category ? GRAM_ESTIMATORS[selectedFood.category] ?? [] : [];

  return (
    <div className="rounded-xl border border-border bg-card p-4 animate-fade-up">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{isEditing ? "Edit Food" : "Add Food"}</h3>
          {!isEditing && (
            <button
              type="button"
              onClick={toggleCaloriesOnly}
              className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors ${
                caloriesOnly
                  ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
              title="Log calories only (hide macros)"
            >
              <Zap className="size-2.5" />
              Cal only
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onClose()}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        {/* Food search + barcode scanner (only when adding, not editing) */}
        {!isEditing && (
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Search food library</label>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <FoodSearch
                  onSelect={handleFoodSelect}
                  favorites={favorites}
                  onToggleFavorite={handleToggleFavorite}
                />
              </div>
              <BarcodeScanner onSelect={handleFoodSelect} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Search the library, scan a barcode, or enter a custom food below.
            </p>
          </div>
        )}

        {/* Food name + voice input */}
        <div>
          <label className={labelClass}>Food name</label>
          <div className="flex gap-2">
            <input
              value={foodName ?? ""}
              onChange={handleFoodNameChange}
              placeholder="e.g. Chicken breast"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors placeholder:text-muted-foreground"
            />
            {hasSpeechAPI && !isEditing && (
              <button
                type="button"
                onClick={voiceListening ? stopVoice : startVoice}
                className={`flex shrink-0 items-center justify-center rounded-lg border px-3 transition-colors ${
                  voiceListening
                    ? "border-rose-500 bg-rose-500/10 text-rose-600 animate-pulse"
                    : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title={voiceListening ? "Stop listening" : "Speak food name"}
              >
                {voiceListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </button>
            )}
          </div>
          {errors.food && <p className={errorClass}>{errors.food.message}</p>}
          {voiceError && <p className={errorClass}>{voiceError}</p>}
          {voiceListening && (
            <p className="mt-1 text-xs text-rose-500 animate-pulse">Listening… speak now</p>
          )}
        </div>

        {/* Meal type — colored pills */}
        <div>
          <label className={labelClass}>Meal</label>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((t) => {
              const styles = MEAL_TYPE_STYLES[t].pill;
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

        {/* Serving size controls (shown after food selected from search) */}
        {selectedFood && (
          <div className="flex flex-col gap-2">
            <label className={labelClass}>Quantity ({selectedFood.servingUnit})</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  applyCustomAmount(e.target.value);
                }}
                className="h-10 w-28 rounded-lg border border-amber-500 bg-background px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-amber-500/40 text-amber-600 dark:text-amber-400"
              />
              <span className="text-xs text-muted-foreground">{selectedFood.servingUnit} per serving: {selectedFood.servingSize}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MULTIPLIERS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => applyMultiplier(m)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                    activeMultiplier === m
                      ? "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {m}×
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Number of servings — shown for manually typed new foods (not from library) */}
        {!isEditing && !selectedFood && foodName && (
          <div>
            <label className={labelClass}>Number of servings</label>
            <div className="flex items-center gap-3">
              <MacroStepper
                value={activeMultiplier}
                onChange={(v) => {
                  const mult = Math.max(0.5, v);
                  setActiveMultiplier(mult);
                }}
                max={20}
                colorClass="text-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Macros above are per serving · total = macros × servings
              </p>
            </div>
          </div>
        )}

        {/* Macro steppers */}
        <div className={`grid gap-3 ${caloriesOnly ? "grid-cols-1" : "grid-cols-2 sm:grid-cols-4"}`}>
          {(caloriesOnly ? ["calories"] : ["calories", "protein", "carbs", "fat"] as const).map((field) => (
            <div key={field}>
              <label className={`${labelClass} ${MACRO_LABELS[field].color}`}>
                {MACRO_LABELS[field].label}
              </label>
              <MacroStepper
                value={watch(field as keyof FormData) as number ?? 0}
                onChange={(v) => setValue(field as keyof FormData, v as never)}
                max={field === "calories" ? 9999 : 999}
                colorClass={MACRO_LABELS[field].color}
              />
              {errors[field as keyof FormData] && (
                <p className={errorClass}>{errors[field as keyof FormData]!.message as string}</p>
              )}
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
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Serving size</label>
                <input
                  type="number"
                  value={watch("servingSize")}
                  min={0.1}
                  step={0.1}
                  onChange={(e) => setValue("servingSize", parseFloat(e.target.value) || 1)}
                  placeholder="1"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className={labelClass}>Unit</label>
                <input
                  value={watch("servingUnit")}
                  onChange={(e) => setValue("servingUnit", e.target.value)}
                  placeholder="g / oz / cup / piece"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors placeholder:text-muted-foreground"
                />
              </div>
              <div>
                <label className={labelClass}>Notes (optional)</label>
                <input
                  value={watch("notes") ?? ""}
                  onChange={(e) => setValue("notes", e.target.value)}
                  placeholder="e.g. 200g cooked"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-colors placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Gram estimator chips */}
            {gramEstimators.length > 0 && (
              <div>
                <p className="text-[11px] text-muted-foreground mb-1.5">Portion reference</p>
                <div className="flex flex-wrap gap-1.5">
                  {gramEstimators.map(({ label, grams }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleGramChip(grams)}
                      className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Save to community library */}
        {!isEditing && (
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
          <Button type="button" variant="outline" size="sm" onClick={() => onClose()}>
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
