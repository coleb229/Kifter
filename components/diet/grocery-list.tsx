"use client";

import { useState, useTransition } from "react";
import { ShoppingCart, RefreshCw, Check, AlertCircle } from "lucide-react";
import { generateGroceryList, type GroceryCategory } from "@/actions/ai-actions";
import type { MacroTarget } from "@/types";

interface Props {
  targets: MacroTarget | null;
}

export function GroceryList({ targets }: Props) {
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<GroceryCategory[]>([]);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState(false);

  function handleGenerate() {
    setError("");
    startTransition(async () => {
      const result = await generateGroceryList();
      if (result.success) {
        setCategories(result.data);
        setChecked(new Set());
        setGenerated(true);
      } else {
        setError(result.error);
      }
    });
  }

  function toggleItem(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const totalItems = categories.reduce((s, c) => s + c.items.length, 0);
  const checkedCount = checked.size;

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-4 text-emerald-500" />
          <p className="text-sm font-semibold">AI Grocery List</p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`size-3.5 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Generating…" : generated ? "Regenerate" : "Generate"}
        </button>
      </div>

      {targets && (
        <p className="text-xs text-muted-foreground">
          Based on your targets: {targets.calories} kcal · {targets.protein}g protein · {targets.carbs}g carbs · {targets.fat}g fat
        </p>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertCircle className="size-4" />
          {error}
        </div>
      )}

      {!generated && !isPending && !error && (
        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border">
          <p className="text-sm text-muted-foreground">Click Generate to create a personalized grocery list</p>
        </div>
      )}

      {categories.length > 0 && (
        <>
          {checkedCount > 0 && (
            <p className="text-xs text-muted-foreground">{checkedCount} / {totalItems} items checked</p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {categories.map((cat) => (
              <div key={cat.category} className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat.category}</p>
                <ul className="flex flex-col gap-1.5">
                  {cat.items.map((item) => {
                    const key = `${cat.category}:${item}`;
                    const isChecked = checked.has(key);
                    return (
                      <li key={item}>
                        <button
                          type="button"
                          onClick={() => toggleItem(key)}
                          className={`flex w-full items-center gap-2 text-left text-sm transition-colors ${isChecked ? "line-through text-muted-foreground" : "text-foreground"}`}
                        >
                          <span className={`flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${isChecked ? "bg-emerald-500 border-emerald-500" : "border-border"}`}>
                            {isChecked && <Check className="size-2.5 text-white" />}
                          </span>
                          {item}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
          {checkedCount === totalItems && totalItems > 0 && (
            <p className="text-xs text-center text-emerald-600 dark:text-emerald-400 font-medium">All items checked — happy shopping!</p>
          )}
        </>
      )}
    </div>
  );
}
