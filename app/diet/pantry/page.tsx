export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft, ChefHat } from "lucide-react";
import { getSavedRecipes } from "@/actions/pantry-actions";
import { recipeDatabase } from "@/lib/recipe-database";
import { PantryView } from "@/components/pantry/pantry-view";
import { Button } from "@/components/ui/button";

export default async function PantryPage() {
  const savedResult = await getSavedRecipes();
  const savedRecipeIds = savedResult.success
    ? savedResult.data.map((s) => s.recipeId)
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between animate-fade-up">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-950/40">
            <ChefHat className="size-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pantry</h1>
            <p className="text-sm text-muted-foreground">
              {recipeDatabase.length} meal prep recipes
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" render={<Link href="/diet" />}>
          <ArrowLeft className="size-4" />
          Diet
        </Button>
      </div>

      <PantryView
        recipes={recipeDatabase}
        initialSavedIds={savedRecipeIds}
      />
    </div>
  );
}
