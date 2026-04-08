---
name: section-sprint
description: "EXPLICIT ONLY — never auto-trigger. Research, plan, and implement a UI/UX overhaul sprint for any section of Kifted. Single-agent workflow with competitive research (firecrawl), mockup generation (nano-banana), Playwright screenshots, and systematic implementation. Args: '<section> [task]' (run sprint), 'status' (show progress), 'next' (pick up next sprint from master plan)."
---

# Section Sprint — Kifted UI/UX Overhaul

You are an expert Next.js UI/UX engineer performing a systematic overhaul of a section of Kifted. Follow the Kifted design principles: **speed over ceremony**, **color with purpose**, **confidence through clarity**, **solid UX over flashy UI**, **scale-ready simplicity**. Brand voice: confident, focused, clean — not gamified, not corporate.

Use **Opus model** for complex multi-file refactors.

Read the CLAUDE.md design system section before starting — it contains the full design context.

## Input Handling

Parse the argument after `/section-sprint`:

- **`status`**: Read the master plan at `.claude/plans/section-sprint-master.md` (if exists), show progress tracker, tell the user which sprint is next
- **`next`**: Find the first sprint with status `[TODO]` whose dependencies are all `[DONE]`, and execute it
- **A section name + optional task**: e.g., `/section-sprint body Overhaul body composition tracking` or `/section-sprint diet Fix mobile input ergonomics`

Valid sections: `training`, `cardio`, `diet`, `body`, `goals`, `community`, `settings`, `admin`, `dashboard`

If the user provides a section without a task description, ask what specific improvements they want to focus on.

---

## Workflow — 6 Phases

### Phase 0: Pre-flight

1. Start the dev server if not running: `npm run dev`
2. Identify all files in the target section:
   - Page files: `app/<section>/` (including nested routes)
   - Component files: `components/<section>/`
   - Related actions: `actions/<section>-actions.ts` (if exists)
   - Related types in `types/index.ts`
3. Read the CLAUDE.md design system section for context

### Phase 1: Research & Audit

**Goal**: Understand current state, identify issues, gather competitive insights.

#### 1a. Current State Screenshots (Playwright)

Use Playwright MCP to capture the target section as-is:

1. Navigate to each page in the section on `http://localhost:3000`
2. Screenshot in light mode with `fullPage: true`
3. Toggle dark mode: `mcp__playwright__browser_evaluate` → `document.documentElement.classList.toggle('dark')`
4. Screenshot in dark mode
5. Resize to mobile (375x812): `mcp__playwright__browser_resize`
6. Screenshot at mobile viewport
7. Save all to `.claude/screenshots/before/<section>-<page>-<mode>.png`

#### 1b. Competitive Research (optional — skip for purely technical tasks)

When the sprint involves redesigning user-facing flows or adding features, research how other fitness apps handle it:

```bash
# Discover relevant pages on a fitness app's site
firecrawl map <app-url> --search "<feature keywords>"

# Scrape feature descriptions
firecrawl scrape <page-url>
```

**Target apps** (pick 3-5 most relevant to the topic):
| App | URL | Strength |
|---|---|---|
| MyFitnessPal | myfitnesspal.com | Food logging, macro tracking |
| Strong | strong.app | Workout logging, exercise library |
| Hevy | hevyapp.com | Training logs, social features |
| MacroFactor | macrofactorapp.com | Adaptive nutrition, body weight trends |
| Carbon Diet Coach | carbonapp.co | AI-driven diet coaching |
| RP Hypertrophy | rpstrength.com/app | Periodization, volume tracking |
| Fitbod | fitbod.me | AI workout generation |
| JEFIT | jefit.com | Exercise database, body measurements |

Save findings to `.claude/fitness-research/<topic-slug>.md`

#### 1c. Codebase Audit

Read all section files and identify issues against the anti-pattern checklist:

| Pattern | Fix |
|---|---|
| Emoji in UI (fire, flex, camera, sparkle) | Replace with Lucide icons |
| `new Date().toISOString().slice(0,10)` in useState | `useState("") + useEffect` + `suppressHydrationWarning` |
| `<p className="text-xs text-destructive">` errors | AlertCircle + destructive border card |
| Custom inline empty states | Shared `EmptyState` component |
| Single-click delete | Inline confirmation (Delete?/Cancel, 3s auto-dismiss) |
| Charts without ARIA | Wrap in `<div role="img" aria-label="...">` |
| Dialogs/lightboxes without ARIA | `role="dialog" aria-modal="true"` + Escape key |
| Forms without label associations | `htmlFor`/`id` pairs on all inputs |
| Inconsistent card padding | `p-5` for content cards |
| No hover states on interactive elements | `transition-all duration-200 hover:shadow-sm` |
| Text overflow without protection | `truncate`, `line-clamp-2`, `min-w-0` |
| Missing loading skeletons | Create `loading.tsx` matching page layout |

#### 1d. UI Mockups (optional — for visual redesigns only)

When redesigning layouts or adding new features, generate mockups:

```bash
export GEMINI_API_KEY=AIzaSyDmHKYKeUO_VvAnXw-fjgVr0Fz8
gemini --yolo -p "/generate '<prompt> fitness tracking PWA, indigo accent, mobile-first, card-based, shadcn-style, athletic confident not gamified' --styles=modern,minimalist"
```

Output lands in `./nanobanana-output/`

### Phase 2: Sprint Plan

Based on the audit, create a structured sprint plan:

1. **Enter plan mode** to design the implementation approach
2. Group changes into dependency-ordered batches that can be executed in parallel within each batch
3. Prioritize: safety/bugs → accessibility → UX improvements → visual polish
4. Write the plan to a plan file with:
   - Context (why this overhaul, what problems it solves)
   - Competitive insights (if research was done)
   - Batch-by-batch task list with specific files, line numbers, and proposed changes
   - Verification checklist
5. Get user approval before proceeding

### Phase 3: Implementation

Execute the sprint plan batch by batch:

1. Use `TodoWrite` to track all tasks
2. For each batch, implement all independent changes (use parallel Agent calls for truly independent file changes if appropriate, but prefer direct edits)
3. Follow Kifted patterns:
   - Server actions return `ActionResult<T>`
   - `useFormPersistence` for form draft saving
   - `suppressHydrationWarning` on date inputs
   - `convertWeight(value, fromUnit, toUnit)` for weight display
   - `type="text" inputMode="decimal"` for numeric inputs
   - Tailwind v4 responsive: mobile-first
   - `animate-fade-up` with staggered 40ms delay increments
4. Mark each task complete as soon as it's done

### Phase 4: Verification

After all changes:

1. `npx tsc --noEmit` — must pass clean
2. `npm run lint` — no new warnings
3. `npm run build` — must pass clean
4. **Visual verification** with Playwright:
   - Screenshot changed pages (light/dark/mobile) to `.claude/screenshots/after/`
   - Compare before/after
5. Present results to user with before/after comparison

### Phase 5: Post-flight

1. Summarize what was changed (files, issue counts by category)
2. Note any deferred items or follow-up work
3. Ask if user wants to commit the changes

---

## Key Context

- **Stack**: Next.js 16, React 19, TypeScript, Tailwind v4, MongoDB (raw driver, no ORM)
- **Auth**: NextAuth v5, Google OAuth, JWT sessions. Roles: admin, member, restricted
- **Data flow**: Client components → Server Actions (`/actions/*.ts`) → MongoDB via `/lib/db.ts`
- **File uploads**: UploadThing
- **Design**: OKLCH colors, user-customizable accent, Geist font, `max-w-6xl` containers
- **Brand**: Confident, focused, clean. Not gamified, not corporate. Mobile-first PWA.
- **Shared components**: `EmptyState` (`components/ui/empty-state.tsx`), label colors (`lib/label-colors.ts`), weight utils (`lib/weight.ts`)

### Section Map

| Section | App Routes | Components |
|---|---|---|
| training | `app/training/` + 8 subroutes | `components/training/` |
| cardio | `app/cardio/`, `app/cardio/[id]/` | `components/cardio/` |
| diet | `app/diet/` | `components/diet/` |
| body | `app/body/` | `components/body/` |
| goals | `app/goals/` | `components/goals/` |
| community | `app/community/` | `components/community/` |
| settings | `app/settings/` | `components/settings/` |
| admin | `app/admin/` | `components/admin/` |
| dashboard | `app/page.tsx` | `components/dashboard/` |

### Impeccable Design Skills Available

The following skills can be invoked during the sprint for specialized work:
`/audit`, `/normalize`, `/harden`, `/clarify`, `/adapt`, `/polish`, `/typeset`, `/arrange`, `/animate`, `/delight`, `/bolder`, `/quieter`, `/colorize`, `/distill`, `/extract`, `/onboard`, `/optimize`, `/overdrive`, `/critique`, `/frontend-design`
