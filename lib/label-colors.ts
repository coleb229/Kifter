import type { BodyTarget, MealType } from "@/types";
import type { RecipeCategory } from "@/lib/recipe-database";

export type MacroKey = "calories" | "protein" | "carbs" | "fat";

export const MACRO_COLORS: Record<
  MacroKey,
  { text: string; hex: string; stroke: string; trackStroke: string; bar: string; barTrack: string }
> = {
  calories: { text: "text-indigo-600 dark:text-indigo-400",  hex: "#6366f1", stroke: "stroke-indigo-500",  trackStroke: "stroke-indigo-100 dark:stroke-indigo-950/60",  bar: "bg-indigo-500",  barTrack: "bg-indigo-100 dark:bg-indigo-950/60"  },
  protein:  { text: "text-emerald-600 dark:text-emerald-400", hex: "#10b981", stroke: "stroke-emerald-500", trackStroke: "stroke-emerald-100 dark:stroke-emerald-950/60", bar: "bg-emerald-500", barTrack: "bg-emerald-100 dark:bg-emerald-950/60" },
  carbs:    { text: "text-amber-600 dark:text-amber-400",    hex: "#f59e0b", stroke: "stroke-amber-500",   trackStroke: "stroke-amber-100 dark:stroke-amber-950/60",   bar: "bg-amber-500",   barTrack: "bg-amber-100 dark:bg-amber-950/60"   },
  fat:      { text: "text-rose-600 dark:text-rose-400",      hex: "#f43f5e", stroke: "stroke-rose-500",    trackStroke: "stroke-rose-100 dark:stroke-rose-950/60",    bar: "bg-rose-500",    barTrack: "bg-rose-100 dark:bg-rose-950/60"    },
};

export const BODY_TARGET_STYLES: Record<
  BodyTarget,
  { pill: { active: string; inactive: string }; badge: string; dot: string }
> = {
  "Push":       { pill: { active: "bg-indigo-500 border-indigo-500 text-white",   inactive: "border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40" }, badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400",  dot: "bg-indigo-500"  },
  "Pull":       { pill: { active: "bg-sky-500 border-sky-500 text-white",         inactive: "border-sky-200 text-sky-600 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950/40"                 }, badge: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400",            dot: "bg-sky-500"     },
  "Legs":       { pill: { active: "bg-emerald-500 border-emerald-500 text-white", inactive: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40" }, badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400", dot: "bg-emerald-500" },
  "Upper Body": { pill: { active: "bg-violet-500 border-violet-500 text-white",   inactive: "border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40" }, badge: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400",  dot: "bg-violet-500"  },
  "Lower Body": { pill: { active: "bg-teal-500 border-teal-500 text-white",       inactive: "border-teal-200 text-teal-600 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950/40"               }, badge: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",        dot: "bg-teal-500"    },
  "Full Body":  { pill: { active: "bg-amber-500 border-amber-500 text-white",     inactive: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40"         }, badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",    dot: "bg-amber-500"   },
  "Core":       { pill: { active: "bg-orange-500 border-orange-500 text-white",   inactive: "border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/40"   }, badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",  dot: "bg-orange-500"  },
  "Cardio":     { pill: { active: "bg-cyan-500 border-cyan-500 text-white",       inactive: "border-cyan-200 text-cyan-600 hover:bg-cyan-50 dark:border-cyan-800 dark:text-cyan-400 dark:hover:bg-cyan-950/40"               }, badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400",        dot: "bg-cyan-500"    },
  "Other":      { pill: { active: "bg-slate-500 border-slate-500 text-white",     inactive: "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/40"         }, badge: "bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400",    dot: "bg-slate-400"   },
};

export const MEAL_TYPE_STYLES: Record<
  MealType,
  { pill: { active: string; inactive: string }; icon: string; header: string; borderLeft: string }
> = {
  breakfast: { pill: { active: "bg-amber-500 border-amber-500 text-white",   inactive: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40"     }, icon: "text-amber-500",   header: "text-amber-600 dark:text-amber-400",   borderLeft: "border-l-amber-500"   },
  lunch:     { pill: { active: "bg-emerald-500 border-emerald-500 text-white", inactive: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40" }, icon: "text-emerald-500", header: "text-emerald-600 dark:text-emerald-400", borderLeft: "border-l-emerald-500" },
  dinner:    { pill: { active: "bg-indigo-500 border-indigo-500 text-white",  inactive: "border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/40" }, icon: "text-indigo-500",  header: "text-indigo-600 dark:text-indigo-400",  borderLeft: "border-l-indigo-500"  },
  snack:     { pill: { active: "bg-orange-500 border-orange-500 text-white",  inactive: "border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/40" }, icon: "text-orange-500",  header: "text-orange-600 dark:text-orange-400",  borderLeft: "border-l-orange-500"  },
};

export const RECIPE_CATEGORY_STYLES: Record<
  RecipeCategory,
  { pill: { active: string; inactive: string }; badge: string }
> = {
  "Poultry":      { pill: { active: "bg-amber-500 border-amber-500 text-white",     inactive: "border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/40"         }, badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400"      },
  "Fish":         { pill: { active: "bg-sky-500 border-sky-500 text-white",          inactive: "border-sky-200 text-sky-600 hover:bg-sky-50 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950/40"                     }, badge: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400"               },
  "Beef":         { pill: { active: "bg-rose-500 border-rose-500 text-white",        inactive: "border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950/40"               }, badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"           },
  "Vegetarian":   { pill: { active: "bg-emerald-500 border-emerald-500 text-white",  inactive: "border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40" }, badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400" },
  "Plant-based":  { pill: { active: "bg-lime-500 border-lime-500 text-white",        inactive: "border-lime-200 text-lime-600 hover:bg-lime-50 dark:border-lime-800 dark:text-lime-400 dark:hover:bg-lime-950/40"               }, badge: "bg-lime-100 text-lime-700 dark:bg-lime-950/50 dark:text-lime-400"           },
  "Sweet":        { pill: { active: "bg-pink-500 border-pink-500 text-white",        inactive: "border-pink-200 text-pink-600 hover:bg-pink-50 dark:border-pink-800 dark:text-pink-400 dark:hover:bg-pink-950/40"               }, badge: "bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400"           },
  "Breakfast":    { pill: { active: "bg-orange-500 border-orange-500 text-white",    inactive: "border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/40"   }, badge: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400"   },
  "Air Fryer":    { pill: { active: "bg-violet-500 border-violet-500 text-white",    inactive: "border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/40"   }, badge: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400"   },
};
