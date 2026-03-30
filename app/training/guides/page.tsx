export const dynamic = "force-dynamic";

import Link from "next/link";
import { BookOpen, Activity, Dumbbell, Clock, ArrowRight } from "lucide-react";
import { getPublishedGuides } from "@/actions/published-guide-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { auth } from "@/auth";
import type { PublishedGuide, GuideType } from "@/types";

const TYPE_META: Record<GuideType, { icon: React.ReactNode; label: string; bg: string; text: string }> = {
  stability: {
    icon: <Activity className="size-3.5" />,
    label: "Stability",
    bg: "bg-emerald-100 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  warmup: {
    icon: <Dumbbell className="size-3.5" />,
    label: "Warmup",
    bg: "bg-amber-100 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
  },
  form_guide: {
    icon: <BookOpen className="size-3.5" />,
    label: "Form Guide",
    bg: "bg-indigo-100 dark:bg-indigo-950/40",
    text: "text-indigo-700 dark:text-indigo-300",
  },
};

const DIFFICULTY_DOT: Record<string, string> = {
  beginner: "bg-emerald-400",
  intermediate: "bg-amber-400",
  advanced: "bg-rose-400",
};

function GuideCard({ guide, draft }: { guide: PublishedGuide; draft?: boolean }) {
  const type = TYPE_META[guide.type];
  const thumb = guide.sourceYoutubeIds[0]
    ? `https://img.youtube.com/vi/${guide.sourceYoutubeIds[0]}/mqdefault.jpg`
    : null;

  return (
    <Link
      href={`/training/guides/${guide.slug}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:shadow-md hover:-translate-y-0.5 ${
        draft ? "border-dashed border-border opacity-80" : "border-border hover:border-indigo-400/50"
      }`}
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden bg-muted">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className={`w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105 ${draft ? "opacity-60" : ""}`}
          />
        ) : (
          <div className="aspect-video w-full flex items-center justify-center">
            <BookOpen className="size-10 text-muted-foreground/30" />
          </div>
        )}
        {/* Type badge overlaid on image */}
        <span className={`absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${type.bg} ${type.text}`}>
          {type.icon}
          {type.label}
        </span>
        {draft && (
          <span className="absolute top-3 right-3 rounded-full bg-amber-100 dark:bg-amber-950/80 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
            Draft
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Difficulty + duration row */}
        <div className="mb-2 flex items-center gap-3">
          {guide.content.difficulty && (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`size-2 rounded-full ${DIFFICULTY_DOT[guide.content.difficulty] ?? "bg-muted-foreground"}`} />
              <span className="capitalize">{guide.content.difficulty}</span>
            </span>
          )}
          {guide.content.duration && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {guide.content.duration}
            </span>
          )}
        </div>

        <h3 className="mb-2 text-base font-bold leading-snug tracking-tight">{guide.title}</h3>
        <p className="mb-4 flex-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {guide.content.intro.slice(0, 160)}
        </p>

        {/* Footer CTA */}
        <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
          Read Guide
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

export default async function GuidesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const result = await getPublishedGuides(isAdmin);
  const guides = result.success ? result.data : [];
  const published = guides.filter((g) => g.status === "published");
  const drafts = isAdmin ? guides.filter((g) => g.status === "draft") : [];

  return (
    <div className="animate-fade-up">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
          <BookOpen className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Guides</h1>
          <p className="text-sm text-muted-foreground">
            Step-by-step guides written for real people — no gym experience required.
          </p>
        </div>
      </div>

      {isAdmin && drafts.length > 0 && (
        <div className="mb-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">Drafts — Admin Only</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((g) => <GuideCard key={g.id} guide={g} draft />)}
          </div>
        </div>
      )}

      {published.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No guides published yet"
          description={isAdmin ? "Head to the admin panel to generate and publish your first guide." : "Check back soon — guides are on the way."}
          action={isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
            >
              Go to Admin Panel
              <ArrowRight className="size-4" />
            </Link>
          ) : undefined}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((g) => <GuideCard key={g.id} guide={g} />)}
        </div>
      )}
    </div>
  );
}
