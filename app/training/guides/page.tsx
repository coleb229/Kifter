import Link from "next/link";
import { BookOpen, Activity, Dumbbell, Clock } from "lucide-react";
import { getPublishedGuides } from "@/actions/published-guide-actions";
import { auth } from "@/auth";
import type { GuideType } from "@/types";

const TYPE_ICONS: Record<GuideType, React.ReactNode> = {
  stability: <Activity className="size-3.5" />,
  warmup: <Dumbbell className="size-3.5" />,
  form_guide: <BookOpen className="size-3.5" />,
};

const TYPE_COLORS: Record<GuideType, string> = {
  stability: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300",
  warmup: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300",
  form_guide: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300",
};

const TYPE_LABELS: Record<GuideType, string> = {
  stability: "Stability",
  warmup: "Warmup",
  form_guide: "Form Guide",
};

const DIFFICULTY_COLORS = {
  beginner: "text-emerald-600 dark:text-emerald-400",
  intermediate: "text-amber-600 dark:text-amber-400",
  advanced: "text-rose-600 dark:text-rose-400",
};

export default async function GuidesPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  const result = await getPublishedGuides(isAdmin);
  const guides = result.success ? result.data : [];
  const published = guides.filter((g) => g.status === "published");
  const drafts = isAdmin ? guides.filter((g) => g.status === "draft") : [];

  return (
    <div>
      <div className="mb-8 flex items-center gap-3 animate-fade-up">
        <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
          <BookOpen className="size-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Training Guides</h1>
          <p className="text-sm text-muted-foreground">Expert guides to level up your training</p>
        </div>
      </div>

      {isAdmin && drafts.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Drafts (admin only)</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drafts.map((guide) => {
              const thumb = guide.sourceYoutubeIds[0]
                ? `https://img.youtube.com/vi/${guide.sourceYoutubeIds[0]}/mqdefault.jpg`
                : null;
              return (
                <Link
                  key={guide.id}
                  href={`/training/guides/${guide.slug}`}
                  className="group rounded-xl border border-dashed border-border bg-card overflow-hidden hover:border-indigo-400 transition-colors"
                >
                  {thumb && (
                    <img src={thumb} alt="" className="w-full aspect-video object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                  )}
                  <div className="p-4">
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[guide.type]}`}>
                        {TYPE_ICONS[guide.type]}{TYPE_LABELS[guide.type]}
                      </span>
                      <span className="rounded-full bg-amber-100 dark:bg-amber-950/40 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">Draft</span>
                    </div>
                    <p className="font-semibold">{guide.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{guide.content.intro.slice(0, 150)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {published.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <BookOpen className="mx-auto mb-3 size-8 text-muted-foreground/40" />
          <p className="font-medium">No guides published yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin ? "Head to the admin panel to generate and publish your first guide." : "Check back soon."}
          </p>
          {isAdmin && (
            <Link href="/admin" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              Go to Admin Panel
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((guide) => {
            const thumb = guide.sourceYoutubeIds[0]
              ? `https://img.youtube.com/vi/${guide.sourceYoutubeIds[0]}/mqdefault.jpg`
              : null;
            return (
              <Link
                key={guide.id}
                href={`/training/guides/${guide.slug}`}
                className="group rounded-xl border border-border bg-card overflow-hidden hover:border-indigo-400/60 hover:shadow-sm transition-all"
              >
                {thumb && (
                  <img src={thumb} alt="" className="w-full aspect-video object-cover group-hover:opacity-90 transition-opacity" />
                )}
                <div className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[guide.type]}`}>
                      {TYPE_ICONS[guide.type]}{TYPE_LABELS[guide.type]}
                    </span>
                    {guide.content.difficulty && (
                      <span className={`text-[10px] font-medium capitalize ${DIFFICULTY_COLORS[guide.content.difficulty]}`}>
                        {guide.content.difficulty}
                      </span>
                    )}
                    {guide.content.duration && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        <Clock className="size-3" />{guide.content.duration}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold leading-snug">{guide.title}</p>
                  <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{guide.content.intro.slice(0, 150)}</p>
                  <p className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                    Read Guide →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
