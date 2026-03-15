import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { allGuides } from "@/lib/guides-data";
import { GuidesBrowser } from "@/components/training/guides-browser";

export default function GuidesPage() {
  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/training"
        className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to training
      </Link>

      <div className="flex items-center gap-3 animate-fade-up">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
          <BookOpen className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Guides</h1>
          <p className="text-sm text-muted-foreground">
            {allGuides.length} guides across 6 categories
          </p>
        </div>
      </div>

      <GuidesBrowser guides={allGuides} />
    </div>
  );
}
