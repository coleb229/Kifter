import { readFileSync } from "fs";
import { join } from "path";

export type ChangelogCategory = "feature" | "design" | "fix" | "infrastructure" | "analytics";

export interface ChangelogItem {
  text: string;
  category: ChangelogCategory;
}

export interface ChangelogEntry {
  id: string;
  date: string;
  label?: string;
  items: ChangelogItem[];
  dominantCategory: ChangelogCategory;
}

export interface ChangelogEntryMeta {
  title?: string;
  screenshotPath?: string;
  screenshotAlt?: string;
}

export type ChangelogMeta = Record<string, ChangelogEntryMeta>;

export type ChangelogEntryWithMeta = ChangelogEntry & { meta: ChangelogEntryMeta };

const ANALYTICS_KEYWORDS = ["analytics", "chart", "visualization", "stat card", "recharts", "graph"];
const DESIGN_KEYWORDS = [
  "animation", "animate", "fade", "hover", "palette", "theme", "font", "visual",
  "color", "hero", "entrance", "button effect", "dark mode", "orb", "ui", "style",
  "layout", "badge", "landing page", "gradient",
];
const FIX_KEYWORDS = ["fix", "fixed", "bug", "error", "warning", "removed unused", "build failure", "switched to system"];
const INFRA_KEYWORDS = [
  "scaffold", "setup", "auth", "oauth", "mongodb", "middleware", "config", "jwt",
  "deploy", "build", "env", "typescript", "eslint", "next.js", "tailwind", "set up",
  "singleton", "route handler", "edge runtime", "session strategy",
];

function categorize(text: string): ChangelogCategory {
  const lower = text.toLowerCase();
  if (ANALYTICS_KEYWORDS.some((k) => lower.includes(k))) return "analytics";
  if (DESIGN_KEYWORDS.some((k) => lower.includes(k))) return "design";
  if (FIX_KEYWORDS.some((k) => lower.includes(k))) return "fix";
  if (INFRA_KEYWORDS.some((k) => lower.includes(k))) return "infrastructure";
  return "feature";
}

function dominantCategory(items: ChangelogItem[]): ChangelogCategory {
  const counts: Record<ChangelogCategory, number> = {
    feature: 0,
    design: 0,
    fix: 0,
    infrastructure: 0,
    analytics: 0,
  };
  for (const item of items) counts[item.category]++;
  const priority: ChangelogCategory[] = ["feature", "design", "analytics", "fix", "infrastructure"];
  let best: ChangelogCategory = "feature";
  let bestCount = -1;
  for (const cat of priority) {
    if (counts[cat] > bestCount) {
      best = cat;
      bestCount = counts[cat];
    }
  }
  return best;
}

export function parseChangelog(): ChangelogEntry[] {
  const readme = readFileSync(join(process.cwd(), "README.md"), "utf-8");
  const changelogStart = readme.indexOf("## Changelog");
  if (changelogStart === -1) return [];

  const changelogText = readme.slice(changelogStart);
  const lines = changelogText.split("\n");

  const entries: ChangelogEntry[] = [];
  const dateCounters = new Map<string, number>();

  let currentDate: string | null = null;
  let currentLabel: string | undefined;
  let currentBullets: string[] = [];

  function flushEntry() {
    if (!currentDate || currentBullets.length === 0) return;
    const counter = dateCounters.get(currentDate) ?? 0;
    dateCounters.set(currentDate, counter + 1);
    const id = `${currentDate}-${counter}`;
    const items = currentBullets.map((text) => ({ text, category: categorize(text) }));
    entries.push({
      id,
      date: currentDate,
      label: currentLabel,
      items,
      dominantCategory: dominantCategory(items),
    });
    currentBullets = [];
    currentLabel = undefined;
  }

  const headingRe = /^### (\d{4}-\d{2}-\d{2})(.*)/;

  for (const line of lines) {
    const headingMatch = line.match(headingRe);
    if (headingMatch) {
      flushEntry();
      currentDate = headingMatch[1];
      const suffix = headingMatch[2].trim().replace(/^—\s*/, "").replace(/^\(.*\)$/, "").replace(/^\(latest\)$/, "").trim();
      currentLabel = suffix || undefined;
      continue;
    }
    const bulletMatch = line.match(/^- (.+)/);
    if (bulletMatch && currentDate) {
      currentBullets.push(bulletMatch[1].trim());
    }
  }
  flushEntry();

  return entries;
}
