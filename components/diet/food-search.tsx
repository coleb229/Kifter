"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { Search, Loader2, BookOpen, Users, Star } from "lucide-react";
import { searchFoods } from "@/actions/food-actions";
import type { FoodSearchResult } from "@/actions/food-actions";
import type { FavoriteFood } from "@/types";

interface Props {
  onSelect: (food: FoodSearchResult) => void;
  favorites?: FavoriteFood[];
  onToggleFavorite?: (food: FoodSearchResult) => void;
}

export function FoodSearch({ onSelect, favorites = [], onToggleFavorite }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const favNames = new Set(favorites.map((f) => f.name.toLowerCase()));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const result = await searchFoods(query);
        if (result.success) {
          setResults(result.data);
          setOpen(result.data.length > 0);
          setActiveIndex(-1);
        }
      });
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(food: FoodSearchResult) {
    onSelect(food);
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function sourceIcon(source: FoodSearchResult["source"]) {
    if (source === "favorite") return <Star className="size-3.5 text-amber-400 fill-amber-400" />;
    if (source === "preset") return <BookOpen className="size-3.5 text-indigo-400" />;
    return <Users className="size-3.5 text-emerald-400" />;
  }

  function sourceBadge(source: FoodSearchResult["source"]) {
    if (source === "favorite")
      return (
        <span className="shrink-0 self-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
          Fav
        </span>
      );
    if (source === "preset")
      return (
        <span className="shrink-0 self-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
          Library
        </span>
      );
    return (
      <span className="shrink-0 self-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
        Community
      </span>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search foods (e.g. chicken breast, banana…)"
          className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-9 text-sm outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors placeholder:text-muted-foreground"
        />
      </div>

      {open && results.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg max-h-72 overflow-y-auto"
        >
          {results.map((food, i) => {
            const isFav = favNames.has(food.name.toLowerCase());
            return (
              <li key={food.id}>
                <div
                  className={`flex w-full items-start gap-2 px-3 py-2.5 transition-colors ${
                    i === activeIndex ? "bg-indigo-50 dark:bg-indigo-950/30" : "hover:bg-muted/60"
                  }`}
                >
                  <button
                    type="button"
                    onMouseDown={() => handleSelect(food)}
                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  >
                    {/* Source icon */}
                    <span className="mt-0.5 shrink-0">{sourceIcon(food.source)}</span>

                    {/* Name + macros */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{food.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {food.calories} kcal · P {food.protein}g · C {food.carbs}g · F {food.fat}g
                        <span className="ml-1 opacity-60">per {food.servingSize}{food.servingUnit}</span>
                      </p>
                    </div>

                    {/* Source badge */}
                    {sourceBadge(food.source)}
                  </button>

                  {/* Favorite star toggle */}
                  {onToggleFavorite && (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(food);
                      }}
                      className="ml-1 shrink-0 self-center p-0.5 text-muted-foreground transition-colors hover:text-amber-500"
                      title={isFav ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Star
                        className={`size-3.5 ${isFav ? "fill-amber-400 text-amber-400" : ""}`}
                      />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
