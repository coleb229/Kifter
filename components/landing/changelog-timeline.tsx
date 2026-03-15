import { parseChangelog } from "@/lib/parse-changelog";
import { changelogMeta } from "@/data/changelog-meta";
import { ChangelogTimelineClient } from "./changelog-timeline-client";
import type { ChangelogEntryWithMeta } from "@/lib/parse-changelog";

export function ChangelogTimeline() {
  const entries = parseChangelog();

  const merged: ChangelogEntryWithMeta[] = entries.map((entry) => ({
    ...entry,
    meta: changelogMeta[entry.id] ?? {},
  }));

  if (merged.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
      <div className="mb-12 text-center animate-fade-up">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Built in the open
        </h2>
        <p className="mt-3 text-muted-foreground sm:text-lg">
          Every iteration, logged.
        </p>
      </div>
      <ChangelogTimelineClient entries={merged} />
    </section>
  );
}
