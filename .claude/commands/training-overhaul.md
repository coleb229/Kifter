# Instructions

You are an expert Next.js UI/UX engineer performing a systematic overhaul of the training log section. Follow the Kifted design principles: **speed over ceremony**, **color with purpose**, **confidence through clarity**, **solid UX over flashy UI**, **scale-ready simplicity**. Brand voice: confident, focused, clean — not gamified, not corporate.

Use **Opus model** for Phase 2 and Phase 3 tasks (complex multi-file refactors). Sonnet is fine for other phases.

Read `.impeccable.md` at project root before starting — it contains the full design context.

---

## Pre-flight

1. Start the dev server if not running: `npm run dev`
2. Use Playwright to screenshot every training page as "before" baselines. Save to a temp directory. Pages:
   - `/training`
   - `/training/new`
   - `/training/exercises`
   - `/training/programs`
   - `/training/1rm`
   - `/training/analytics`
   - `/training/report`
   - `/training/guides`
3. Initialize TodoWrite with all 33 tasks from the phases below.

---

## Phase 1: Foundation & Consistency

Skill focus: `/normalize`, `/harden`, `/clarify`

### 1.1 — Normalize empty states across all training pages

**Problem:** Five different empty state patterns exist — varying padding (`p-12`, `p-16`, `p-8`), inconsistent icons, different copy tones.

**Files:**
- `app/training/page.tsx` (~line 87)
- `app/training/analytics/page.tsx` (~line 97)
- `components/training/personal-records.tsx`
- `app/training/guides/page.tsx`
- `app/training/1rm/page.tsx`

**Action:** Create a shared `EmptyState` component at `components/ui/empty-state.tsx` with props: `icon`, `title`, `description`, `action` (optional button). Standardize on `rounded-xl border border-dashed border-border p-12 text-center` with a muted icon, `font-medium` title, and `text-muted-foreground` description. Replace all training empty states with this component.

**Verify:** Playwright screenshots of each page in empty data state.

---

### 1.2 — Add user-facing error feedback to SessionForm

**Problem:** `components/training/session-form.tsx` (~line 82) only does `console.error(result.error)` — users see nothing when session creation fails.

**Action:** Add `form.setError("root", { message: result.error })` and render `errors.root` as a destructive inline error banner below the submit button. Match the pattern from `exercise-logger.tsx` error display.

**Verify:** Disconnect network or send invalid payload, confirm error message renders visually.

---

### 1.3 — Add form persistence indicator

**Problem:** SessionForm saves drafts to localStorage but the "Draft saved" indicator (~line 163) is easy to miss — no icon, minimal styling.

**Action:** Add a `CheckCircle2` icon in `text-emerald-500`, use `text-sm`, and add `animate-fade-up` entrance. On mobile, stack it above the submit button rather than beside it.

**Files:** `components/training/session-form.tsx`

**Verify:** Playwright screenshot before and after filling the form.

---

### 1.4 — Standardize card padding patterns

**Problem:** Card padding varies: `p-4` (weekly-plan-strip), `p-5` (most cards), `px-5 py-3` (streak-banner). Inconsistent visual weight.

**Action:** Audit all training components. Standardize on `p-5` for content cards and `px-5 py-3.5` for banner-style cards (streak, suggestions).

**Files:** All components under `components/training/` using card patterns.

**Verify:** Side-by-side Playwright screenshots of `/training` hub.

---

### 1.5 — Replace gamified emoji with brand-aligned icons

**Problem:** `🔥` emoji in streak-banner.tsx (~line 28) and `💪` in exercise-logger.tsx contradict the "not gamified" brand principle.

**Action:** Replace fire emoji with `Flame` icon from lucide-react styled `text-orange-500 size-5`. Replace "Go! 💪" with "Go" + `Zap` icon in `text-emerald-500`. Keep the energy, drop the gamified aesthetic.

**Files:** `components/training/streak-banner.tsx`, `components/training/exercise-logger.tsx`

**Verify:** Playwright screenshot of streak banner and rest timer completion.

---

### 1.6 — Add missing loading skeletons

**Problem:** Several training subpages have no `loading.tsx` — exercises, programs, guides, report.

**Action:** Create `loading.tsx` skeleton screens for:
- `app/training/exercises/loading.tsx`
- `app/training/programs/loading.tsx`
- `app/training/guides/loading.tsx`
- `app/training/report/loading.tsx`

Follow the pulse skeleton pattern from `app/training/loading.tsx`, matching each page's layout structure.

**Verify:** Throttle network in Playwright and navigate to each page to confirm skeletons render.

---

### 1.7 — Normalize back link text

**Problem:** Back link text varies: "All sessions", "Back to Training", "Training" — inconsistent across subpages.

**Files:**
- `app/training/[id]/page.tsx`
- `app/training/analytics/page.tsx`
- `app/training/exercises/page.tsx`
- `app/training/1rm/page.tsx`
- `app/training/report/page.tsx`

**Action:** Standardize all back links to "Training" with consistent styling: `flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground`.

**Verify:** Navigate to each subpage and confirm consistent back link.

---

## Phase 2: Core Interactions

Skill focus: `/adapt`, `/harden`, `/onboard`, `/polish`

**Use Opus model for this phase.**

### 2.1 — Improve exercise logger mobile input ergonomics

**Problem:** Set input row stepper buttons are 32px (`w-8`) — below Apple's 44px minimum touch target. Number inputs at `text-sm` trigger iOS zoom.

**Files:** `components/training/exercise-logger.tsx` (~lines 296-386)

**Action:**
- On mobile (below `sm:`), increase stepper buttons to `h-11 w-10` (40×44px)
- Add `touch-manipulation` CSS to prevent double-tap zoom delay
- Use `gap-1.5` instead of `gap-1` between elements
- Use `text-base` (16px) on number inputs to prevent iOS zoom on focus

**Verify:** Playwright mobile viewport (375×812) screenshot with 3+ sets.

---

### 2.2 — Add inline confirmation for destructive actions

**Problem:** Delete operations in programs-view execute with no confirmation (single click). Session-exercises has a swipe+tap flow but programs-view doesn't.

**Files:** `components/training/programs-view.tsx`, `components/training/session-exercises.tsx`

**Action:** Add inline confirmation pattern (not a modal — too slow per design principle 1). On delete click, replace button with "Delete? / Cancel" pair that auto-dismisses after 3 seconds. Follow the `confirm-delete` state pattern already in `session-exercises.tsx` (~line 49).

**Verify:** Trigger delete on a program and confirm inline confirmation appears.

---

### 2.3 — Add swipe affordance hint to session exercises

**Problem:** Swipe-to-delete exists (touch handlers at ~line 139 of session-exercises) but there's no visual cue that swiping is possible.

**Files:** `components/training/session-exercises.tsx`

**Action:** On first session view (check localStorage `kifted_swipe_hint_shown`), briefly animate the first exercise card 20px left then back to reveal the delete affordance, with a subtle "Swipe to manage" tooltip. Dismiss permanently after first swipe.

**Verify:** Clear localStorage and take Playwright screenshot of the hint animation.

---

### 2.4 — Fix rest timer overlap on mobile

**Problem:** Rest timer at `fixed bottom-24 inset-x-4` overlaps the exercise form, QuickLogFAB, and browser bottom bars on small screens (iPhone SE 375×667).

**Files:** `components/training/exercise-logger.tsx` (~lines 401-435)

**Action:** Adjust positioning: `fixed bottom-20 right-4 left-4 sm:left-auto sm:right-6 sm:w-72`. Add `max-h-[30vh]` safety. On mobile, collapse to a minimal bar (countdown + dismiss) that expands on tap.

**Verify:** Playwright screenshots at 375×667 (iPhone SE) and 390×844 (iPhone 14) with rest timer active.

---

### 2.5 — Make exercise tag system discoverable

**Problem:** Tags are powerful (compound/isolation/push/pull classification) but the tag input is hidden behind a non-obvious toggle.

**Files:** `components/training/session-exercises.tsx` (~lines 93-114)

**Action:** When an exercise has zero tags, show a subtle "Add tags" pill with `Tag` icon in muted style. When it has tags, show them as small pills with a `+` button inline. Add an `OnboardingTip` for tagging on first session visit (tipKey: `exercise-tags`).

**Verify:** Playwright screenshot of an exercise with 0 tags and one with 2+ tags.

---

### 2.6 — Improve exercise autocomplete UX

**Problem:** Combobox uses 150ms blur setTimeout (~line 230) that feels laggy. No keyboard navigation. No visual grouping for long lists.

**Files:** `components/training/exercise-logger.tsx` (~lines 220-253)

**Action:**
- Add keyboard navigation (arrow keys + Enter to select)
- Group exercises alphabetically with sticky first-letter headers when 10+ items
- Highlight matching substring with `font-semibold`
- Use `onMouseDown` with `preventDefault` on list items to avoid blur race condition

**Verify:** Playwright snapshot of combobox open with search query showing highlighted results.

---

## Phase 3: Information Architecture

Skill focus: `/arrange`, `/distill`, `/clarify`, `/normalize`

**Use Opus model for this phase.**

### 3.1 — Restructure training hub navigation

**Problem:** Six navigation buttons in a row compete for attention. Primary action (Log Workout) is last. On mobile, they wrap to 2-3 rows.

**Files:** `app/training/page.tsx` (~lines 46-66)

**Action:** Separate into:
- **Primary:** "Log Workout" button — full-width on mobile, prominent `default` variant
- **Secondary:** Remaining 5 links — compact icon row or collapsible "More" dropdown on mobile, all visible on desktop

Use `DropdownMenu` from shadcn for secondary items on mobile. Keep all visible on `sm:` and above.

**Verify:** Playwright screenshots at 375px and 1024px widths.

---

### 3.2 — Add progressive disclosure to analytics page

**Problem:** 11 sections render vertically with no grouping or hierarchy. Page can be extremely long.

**Files:** `app/training/analytics/page.tsx` (~lines 54-123)

**Action:** Group into 3 collapsible sections:
1. **Overview** — heatmap, body target chart, volume chart, Apple Health (expanded by default)
2. **Exercise Deep Dive** — analytics dashboard, AI insights (collapsed on mobile, expanded on desktop)
3. **Records & PRs** — personal records, PR heatmap, PR timeline, muscle heatmap (collapsed on mobile)

Add section headers with chevron collapse/expand toggle. Use localStorage to persist open/closed state.

**Verify:** Playwright screenshot with one section collapsed.

---

### 3.3 — Enhance weekly plan strip with day detail

**Problem:** Weekly strip shows only dots. Users can't see what they did without navigating away.

**Files:** `components/training/weekly-plan-strip.tsx`

**Action:** On tap/click of a day cell, expand a small detail popover showing session name(s) and body target(s). On desktop, show on hover. For future days with a program applied, show planned sessions in dashed style.

**Verify:** Playwright click on a day with a session and screenshot the expanded detail.

---

### 3.4 — Fix horizontal scroll discoverability on suggestion cards

**Problem:** `overflow-x-auto` with `scrollbar-hide` makes scroll completely invisible. Users don't know more cards exist.

**Files:** `components/training/rest-day-suggestions.tsx`, `components/training/overload-suggestions.tsx`

**Action:** Add a subtle gradient fade on the right edge when content overflows (CSS `::after` pseudo or overlay div). Remove `scrollbar-hide` and use `scrollbar-thin scrollbar-thumb-border` for a visible but unobtrusive scrollbar.

**Verify:** Playwright screenshot at 375px with 6+ cards to confirm scroll indicator.

---

### 3.5 — Add search/filter to exercises page

**Problem:** No search on exercises management page. Lists become unwieldy as custom exercises grow.

**Files:** `components/training/exercise-manager.tsx`

**Action:** Add search input at top with real-time filtering. Include count badge: "X of Y exercises". Keep grouped by Default/Custom with section headers.

**Verify:** Playwright screenshot with a search query filtering the list.

---

### 3.6 — Normalize page headers with icon badges

**Problem:** Some headers have colored icon badges (1RM, Report) while others are plain text (Analytics, Exercises, Guides).

**Files:**
- `app/training/analytics/page.tsx`
- `app/training/exercises/page.tsx`
- `app/training/guides/page.tsx`

**Action:** Add matching icon badges: Analytics (`BarChart2` indigo), Exercises (`Dumbbell` indigo), Guides (`BookOpen` indigo). Follow the pattern from 1RM page: `size-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/40` container with `size-5 text-indigo-600 dark:text-indigo-400` icon.

**Verify:** Navigate through all subpages and confirm consistent header pattern.

---

## Phase 4: Visual Polish

Skill focus: `/colorize`, `/bolder`, `/typeset`, `/delight`, `/animate`

### 4.1 — Strengthen suggestion card visual hierarchy

**Problem:** Suggestion cards (overload, rest day, deload) blend in with regular content cards.

**Files:** `components/training/overload-suggestions.tsx`, `components/training/rest-day-suggestions.tsx`, `components/training/deload-recommendation.tsx`

**Action:** Add `border-l-3` accent using the card's semantic color (emerald=ready, amber=rest/caution, rose=deload). Increase section header font weight. Add a gentle background tint that reinforces the card's meaning.

**Verify:** Playwright screenshot of training hub with all three suggestion types visible.

---

### 4.2 — Improve typography hierarchy

**Problem:** Section headers inside cards all use `text-sm font-semibold` uniformly — flat hierarchy. Everything looks the same weight.

**Files:** All training page and component headers.

**Action:** Establish three-level hierarchy:
1. **Page title:** `text-2xl font-bold tracking-tight` (already consistent)
2. **Section title:** `text-base font-semibold`
3. **Card header:** `text-sm font-semibold uppercase tracking-wide text-muted-foreground`

Audit all training components and apply consistently.

**Verify:** Full-page Playwright screenshots of analytics and training hub.

---

### 4.3 — Add micro-interactions to session cards

**Problem:** Session cards are static — no hover/tap feedback beyond browser defaults.

**Files:** `components/training/session-card.tsx`

**Action:** Add `hover:shadow-md hover:-translate-y-0.5 transition-all duration-200` (matching guide cards in `app/training/guides/page.tsx` ~line 45). Add `active:scale-[0.98]` for mobile tap feedback. Add subtle pulse on body target dot for today's sessions.

**Verify:** Playwright hover screenshot on desktop viewport.

---

### 4.4 — Polish body target selector

**Problem:** Body target pill transitions between selected/unselected are abrupt. Grid uses 2 columns on mobile which is cramped.

**Files:** `components/training/session-form.tsx` (~lines 115-136)

**Action:** Add `transition-all duration-200` to each button. When selected, add `ring-2 ring-offset-2` using the target's color from `label-colors.ts`. Switch mobile grid to `grid-cols-3` for more compact layout.

**Verify:** Playwright screenshot of form with one target selected showing ring effect.

---

### 4.5 — Refine rest timer with progress bar

**Problem:** Rest timer is functional but visually plain. Countdown color changes at 10s/0s but the card feels disconnected from the design language.

**Files:** `components/training/exercise-logger.tsx` (~lines 401-435)

**Action:** Add a thin progress bar below the timer text that depletes as time counts down (CSS `width` transition). Use indigo brand color, transitioning to amber at 30% remaining and destructive at final 10 seconds. Add matching border color transition.

**Verify:** Start rest timer and take Playwright screenshots at 50%, 25%, and 0% remaining.

---

## Phase 5: Accessibility & Edge Cases

Skill focus: `/harden`

### 5.1 — Add ARIA labels and roles to custom widgets

**Problem:** Exercise logger combobox (~lines 222-253) lacks `role="combobox"`, `aria-expanded`, `aria-activedescendant`. Weekly plan strip days aren't keyboard navigable. Session exercise swipe actions have no keyboard alternative.

**Files:** `components/training/exercise-logger.tsx`, `components/training/session-exercises.tsx`, `components/training/weekly-plan-strip.tsx`

**Action:**
- Add proper ARIA attributes to exercise combobox
- Add `role="grid"` to weekly plan strip with `role="gridcell"` on each day
- Ensure all interactive elements have visible focus rings
- Add keyboard Delete key alternative to swipe-to-delete in session exercises

**Verify:** Tab through exercise logger with Playwright and confirm focus ring visibility.

---

### 5.2 — Handle offline state gracefully

**Problem:** If the user loses connectivity mid-session, form submissions fail silently (console.error only).

**Files:** `components/training/session-form.tsx`, `components/training/exercise-logger.tsx`

**Action:** Add `navigator.onLine` check before form submission. If offline, show inline banner: "You're offline. Your data is saved locally and will sync when you reconnect." Leverage existing form persistence hook as fallback storage.

**Verify:** Use Playwright network conditions to go offline, attempt to log an exercise, confirm offline banner appears.

---

### 5.3 — Add keyboard shortcuts for power users

**Problem:** No keyboard shortcuts for common actions. Power users logging many sets want speed.

**Files:** `components/training/exercise-logger.tsx`, `app/training/[id]/page.tsx`

**Action:**
- `Enter` to submit current set (may already work via form submit)
- `Ctrl/Cmd + N` to focus exercise name input
- Natural `Tab` flow: weight → reps → next set
- `Escape` closes autocomplete dropdown

**Verify:** Use Playwright keyboard commands to navigate a full exercise logging flow.

---

### 5.4 — Handle text overflow and long content

**Problem:** Very long exercise names or session notes may overflow containers. No `truncate` or `line-clamp` protection on all text elements.

**Files:** `components/training/session-card.tsx`, `components/training/session-exercises.tsx`

**Action:** Add `truncate` to exercise names in session cards and session exercises. Add `line-clamp-2` to session notes. Ensure all text containers have `min-w-0` when inside flex parents.

**Verify:** Create a session with a 50+ character exercise name and confirm truncation.

---

### 5.5 — Fix timezone hydration flash on date inputs

**Problem:** Both SessionForm (~lines 48-50) and WeeklyPlanStrip (~lines 17-21) use `useEffect` to correct dates post-hydration, causing a visible flash.

**Files:** `components/training/session-form.tsx`, `components/training/weekly-plan-strip.tsx`

**Action:** Suppress flash by rendering date input with `suppressHydrationWarning` and defaulting to empty on server, then setting on mount. Alternatively use `useSyncExternalStore` with `getServerSnapshot` returning empty and `getSnapshot` returning the local date.

**Verify:** Hard refresh `/training/new` near midnight UTC and confirm no date flash.

---

## Phase 6: Desktop Experience

Skill focus: `/adapt`, `/delight`, `/arrange`

### 6.1 — Two-column layout for session detail page

**Problem:** On desktop (1024px+), session detail renders as a single narrow column. Exercise logger and logged exercises could sit side-by-side.

**Files:** `app/training/[id]/page.tsx`

**Action:** At `lg:` breakpoint, render two-column layout: left column for logged exercises (scrollable), right column for exercise logger (sticky). Use `lg:grid lg:grid-cols-[1fr_400px] lg:gap-8` with `lg:sticky lg:top-24` on the logger.

**Verify:** Playwright screenshot at 1280px width with 3+ exercises logged.

---

### 6.2 — Desktop hover previews on session cards

**Problem:** Session cards show basic info. On desktop, hovering could reveal more detail without navigating.

**Files:** `components/training/session-card.tsx`

**Action:** On desktop hover, reveal a hidden detail row showing exercise count, total volume, and top exercise. Use `group-hover` with CSS transition to expand. Subtle inline expansion, not a tooltip or popover.

**Verify:** Playwright hover on a session card at 1024px and screenshot.

---

### 6.3 — Widen analytics charts on desktop

**Problem:** Charts render at same width on all viewports. Excessive whitespace on desktop.

**Files:** `components/training/analytics-dashboard.tsx`, `components/training/analytics-chart.tsx`

**Action:** Use `max-w-none` on desktop to fill available width. Increase chart height on desktop. Use `lg:grid-cols-4` for stat cards above charts instead of stacking.

**Verify:** Playwright screenshot at 1440px of analytics page.

---

### 6.4 — Desktop-optimized program creation form

**Problem:** Program creation is a long vertical form on all viewports. Desktop wastes space.

**Files:** `components/training/programs-view.tsx`

**Action:** At `lg:` breakpoint, render program details (name, description) in a left column and day/exercise builder in a wider right column. Add drag-to-reorder for days using native drag API. Show a live preview card of the program as it's built.

**Verify:** Playwright screenshot at 1280px of program creation with 2+ days.

---

## Post-flight

1. Take Playwright screenshots of all 11 training pages as "after" images.
2. Run `npx tsc --noEmit` to verify no TypeScript errors.
3. Run `npm run lint` and fix any warnings.
4. Summarize all changes with file paths and before/after comparison notes.

# Tools
Bash
Edit
Write
Read
Glob
Grep
Agent
TodoWrite
Playwright
