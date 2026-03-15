/**
 * Optional metadata to augment README-parsed changelog entries.
 *
 * Keys are ChangelogEntry.id values — "{date}-{index}" where index is the
 * 0-based position of that entry within its date group in README.md (newest
 * entries = index 0). When you add a new entry above existing ones in the
 * README, existing indices shift by 1 — update screenshot keys accordingly.
 * Custom titles remain display-only and are safe to keep as-is.
 *
 * To add a screenshot:
 *   1. Drop the image in public/changelog/
 *   2. Add screenshotPath: "/changelog/my-image.png" to the entry below
 *   3. The placeholder will be replaced automatically on next build
 */

import type { ChangelogMeta } from "@/lib/parse-changelog";

export const changelogMeta: ChangelogMeta = {
  "2026-03-15-0": { title: "Color-Coded UI & Calendar Hover Previews" },
  "2026-03-14-0": { title: "Community, Settings & Admin" },
  "2026-03-14-1": { title: "Entrance Animations & Button Effects" },
  "2026-03-14-2": { title: "Analytics Dashboard" },
  "2026-03-14-3": { title: "Full Session & Exercise CRUD" },
  "2026-03-14-4": { title: "Per-Set Weight Units & Exercise Dropdown" },
  "2026-03-14-5": { title: "Build Fixes & Font Cleanup" },
  "2026-03-13-0": { title: "Core Tracker, Auth & Route Protection" },
  "2026-03-12-0": { title: "Initial Build" },
};
