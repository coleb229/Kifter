"use client";

import { useState, useTransition, useMemo } from "react";
import { Search, Bookmark, BookmarkCheck, Clock, Users, ChevronDown, ChevronUp, UtensilsCrossed, Link2, X, Plus, CalendarPlus } from "lucide-react";
import { saveRecipe, unsaveRecipe } from "@/actions/pantry-actions";
import { RECIPE_CATEGORIES, type RecipePreset, type RecipeCategory } from "@/lib/recipe-database";
import { RECIPE_CATEGORY_STYLES } from "@/lib/label-colors";
import { RecipeLogSheet } from "@/components/pantry/recipe-log-sheet";
import { SubmitRecipeSheet } from "@/components/pantry/submit-recipe-sheet";
import { Button } from "@/components/ui/button";

interface PantryViewProps {
  recipes: RecipePreset[];
  initialSavedIds: string[];
}

export function PantryView({ recipes, initialSavedIds }: PantryViewProps) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | "All">("All");
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(initialSavedIds));
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logRecipe, setLogRecipe] = useState<RecipePreset | null>(null);
  const [showSubmit, setShowSubmit] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let list = recipes;
    if (activeCategory !== "All") {
      list = list.filter((r) => r.category === activeCategory);
    }
    if (showSavedOnly) {
      list = list.filter((r) => savedIds.has(r.id));
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          r.source.toLowerCase().includes(q) ||
          r.tags?.some((t) => t.includes(q))
      );
    }
    return list;
  }, [recipes, activeCategory, showSavedOnly, savedIds, search]);

  function handleToggleSave(recipeId: string) {
    const wasSaved = savedIds.has(recipeId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(recipeId);
      else next.add(recipeId);
      return next;
    });
    startTransition(async () => {
      const result = wasSaved
        ? await unsaveRecipe(recipeId)
        : await saveRecipe(recipeId);
      if (!result.success) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.add(recipeId);
          else next.delete(recipeId);
          return next;
        });
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search bar */}
      <div className="relative animate-fade-up" style={{ animationDelay: "0.05s" }}>
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search recipes"
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-9 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Category pills + saved toggle */}
      <div className="flex flex-col gap-3 animate-fade-up" style={{ animationDelay: "0.1s" }}>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Recipe categories">
          <button
            role="tab"
            aria-selected={activeCategory === "All"}
            onClick={() => setActiveCategory("All")}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              activeCategory === "All"
                ? "bg-foreground border-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            All
          </button>
          {RECIPE_CATEGORIES.map((cat) => {
            const styles = RECIPE_CATEGORY_STYLES[cat];
            return (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                onClick={() => setActiveCategory(cat === activeCategory ? "All" : cat)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                  activeCategory === cat ? styles.pill.active : styles.pill.inactive
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowSavedOnly(!showSavedOnly)}
          aria-pressed={showSavedOnly}
          className={`flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
            showSavedOnly
              ? "bg-amber-500 border-amber-500 text-white"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <Bookmark className="size-3" />
          My Recipes ({savedIds.size})
        </button>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground animate-fade-up" style={{ animationDelay: "0.15s" }}>
        {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
        {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
        {showSavedOnly ? " (saved)" : ""}
      </p>

      {/* Recipe cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 text-center animate-fade-up">
          <UtensilsCrossed className="mb-3 size-8 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">No recipes found</p>
          <p className="mt-1 text-sm text-muted-foreground/70">
            {showSavedOnly ? "Save some recipes to see them here" : "Try a different search or category"}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          {filtered.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isSaved={savedIds.has(recipe.id)}
              isExpanded={expandedId === recipe.id}
              onToggleExpand={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
              onToggleSave={() => handleToggleSave(recipe.id)}
              onLog={() => setLogRecipe(recipe)}
              isPending={isPending}
            />
          ))}
        </div>
      )}

      {/* Submit recipe FAB */}
      <button
        onClick={() => setShowSubmit(true)}
        aria-label="Submit a recipe"
        className="fixed bottom-20 right-4 z-40 flex size-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6"
      >
        <Plus className="size-5" />
      </button>

      {/* Bottom sheets */}
      <RecipeLogSheet
        recipe={logRecipe}
        open={logRecipe !== null}
        onClose={() => setLogRecipe(null)}
      />
      <SubmitRecipeSheet
        open={showSubmit}
        onClose={() => setShowSubmit(false)}
      />
    </div>
  );
}

// ── RecipeCard ────────────────────────────────────────────────────────────────

interface RecipeCardProps {
  recipe: RecipePreset;
  isSaved: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleSave: () => void;
  onLog: () => void;
  isPending: boolean;
}

function RecipeCard({ recipe, isSaved, isExpanded, onToggleExpand, onToggleSave, onLog, isPending }: RecipeCardProps) {
  const styles = RECIPE_CATEGORY_STYLES[recipe.category];

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md">
      {/* Recipe image */}
      {recipe.image && (
        <button onClick={onToggleExpand} className="relative aspect-video w-full overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipe.image}
            alt={recipe.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute bottom-2 left-2 flex gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium shadow-sm ${styles.badge}`}>
              {recipe.category}
            </span>
          </div>
        </button>
      )}

      {/* Header — always visible */}
      <button
        onClick={onToggleExpand}
        className="flex flex-col gap-3 p-4 text-left"
        aria-expanded={isExpanded}
        aria-label={`${recipe.name} — ${recipe.calories} calories, ${recipe.protein}g protein`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold leading-tight">{recipe.name}</h3>
            {!recipe.image && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${styles.badge}`}>
                  {recipe.category}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Link2 className="size-2.5" />
                  {recipe.source}
                </span>
              </div>
            )}
            {recipe.image && (
              <span className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                <Link2 className="size-2.5" />
                {recipe.source}
              </span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="size-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          )}
        </div>

        {/* Macro row */}
        <div className="grid grid-cols-4 gap-2">
          <MacroPill label="Cal" value={recipe.calories} color="text-indigo-600 dark:text-indigo-400" />
          <MacroPill label="P" value={recipe.protein} unit="g" color="text-emerald-600 dark:text-emerald-400" />
          <MacroPill label="C" value={recipe.carbs} unit="g" color="text-amber-600 dark:text-amber-400" />
          <MacroPill label="F" value={recipe.fat} unit="g" color="text-rose-600 dark:text-rose-400" />
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 animate-fade-up" style={{ animationDuration: "0.2s" }}>
          {/* Meta row */}
          <div className="mb-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {recipe.prepTime != null && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                Prep: {recipe.prepTime}m
              </span>
            )}
            {recipe.cookTime != null && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                Cook: {recipe.cookTime}m
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="size-3" />
              {recipe.servings} serving{recipe.servings !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Ingredients */}
          <div className="mb-3">
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ingredients</h4>
            <ul className="space-y-1">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-baseline gap-2 text-sm">
                  <span className="size-1 shrink-0 rounded-full bg-muted-foreground/40 mt-1.5" />
                  <span>
                    <span className="text-muted-foreground">{ing.amount}</span>{" "}
                    {ing.item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="mb-4">
            <h4 className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Instructions</h4>
            <ol className="space-y-2">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-sm">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Tags */}
          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {recipe.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={isSaved ? "default" : "outline"}
              onClick={(e) => { e.stopPropagation(); onToggleSave(); }}
              disabled={isPending}
              className="flex-1"
            >
              {isSaved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
              {isSaved ? "Saved" : "Save"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); onLog(); }}
              className="flex-1"
            >
              <CalendarPlus className="size-4" />
              Log to Diet
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}

// ── MacroPill ────────────────────────────────────────────────────────────────

function MacroPill({ label, value, unit, color }: { label: string; value: number; unit?: string; color: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-muted/50 px-2 py-1.5">
      <span className={`text-sm font-bold tabular-nums ${color}`}>
        {value}{unit}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
