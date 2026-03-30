# Instructions

You are an expert Next.js mobile UX engineer performing a systematic overhaul of the diet/food logging section. **The #1 priority is tactile mobile speed** — logging a meal should feel as fast as sending a text message. Every interaction must respect the user's thumb, their time, and their flow state (often mid-meal-prep or eating).

Follow the Kifted design principles: **speed over ceremony**, **color with purpose**, **confidence through clarity**, **solid UX over flashy UI**, **scale-ready simplicity**. Brand voice: confident, focused, clean — not gamified, not corporate.

Use **Opus model** for Phase 2 and Phase 3 tasks (complex multi-file component redesigns). Sonnet is fine for other phases.

Read `.impeccable.md` at project root before starting — it contains the full design context.

---

## Pre-flight

1. Start the dev server if not running: `npm run dev`
2. Use Playwright to screenshot every diet page at **both 375x812 (iPhone SE/13 mini) and 1280x800 (desktop)** as "before" baselines. Pages:
   - `/diet` (today view)
   - `/diet` (history view — click History tab)
   - `/diet/supplements`
   - `/diet/report`
3. Also screenshot the AddFoodForm bottom sheet open, the templates panel open, and the barcode scanner open.
4. Initialize TodoWrite with all tasks from the phases below.

---

## Phase 1: Safety & Feedback (Critical Bugs)

Skill focus: `/harden`, `/delight`

These are bugs and missing feedback that cause data loss or user confusion. Fix first.

### 1.1 — Add undo-based delete for food entries

**Problem:** `handleDeleteEntry` in diet-log-view.tsx (~line 231) uses a 3-second confirmation timeout then immediately deletes. Fat-finger risk is high on mobile — especially in the meal list where entries are close together.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** Replace the two-tap-to-confirm delete with a toast-based undo pattern:
1. Immediately remove entry from UI (optimistic)
2. Show toast: "Deleted {food name}" with "Undo" button (5-second window)
3. If no undo, fire server delete
4. If undo tapped, restore entry to state

This is faster (1 tap + optional undo) and safer than the current pattern.

**Verify:** Playwright: delete a food entry on mobile, confirm toast with undo button appears. Tap undo, confirm entry is restored.

---

### 1.2 — Fix barcode scan to show review form

**Problem:** `handleBarcodeFoodSelect` auto-adds scanned food without showing AddFoodForm for serving size review. A code comment acknowledges this bug. Users can't adjust quantity before it's logged.

**Files:** `components/diet/diet-log-view.tsx`, `components/diet/add-food-form.tsx`

**Action:** When barcode returns a result, pre-fill AddFoodForm fields (food name, macros, serving size) and open the form in edit-preview mode instead of calling `addDietEntry` directly. User reviews, adjusts serving, then taps "Add Food" to confirm.

**Verify:** Scan a barcode (or use manual entry fallback), confirm AddFoodForm opens pre-filled instead of auto-adding.

---

### 1.3 — Add feedback for recent foods quick-add

**Problem:** Tapping a recent food chip silently adds an entry. No toast, no animation. Users double-tap unknowingly and create duplicates.

**Files:** `components/diet/diet-log-view.tsx`

**Action:**
1. Add success toast: "+1 {food name} added" with green check
2. Add `active:scale-95` press feedback on the chip itself
3. Debounce the quick-add handler (300ms) to prevent double-tap duplicates
4. Briefly dim/disable the chip after tap for 500ms

**Verify:** Tap a recent food chip, confirm toast appears. Rapid double-tap, confirm only one entry is created.

---

### 1.4 — Fix food search dropdown touch handling

**Problem:** `onBlur` with 150ms setTimeout in food-search.tsx causes missed selections on touch devices — the dropdown closes before the tap registers.

**Files:** `components/diet/food-search.tsx`

**Action:**
- Use `onPointerDown` (not `onMouseDown`) for result item selection
- Increase blur timeout from 150ms to 250ms
- Add `touch-action: none` on the dropdown container to prevent scroll interference during selection
- Ensure the favorite star toggle (currently `p-0.5` = ~20px) is enlarged to at least `p-2` (32px) touch target

**Verify:** On mobile viewport, search for a food, tap a result — confirm it selects reliably. Tap the favorite star — confirm it toggles without selecting the food.

---

### 1.5 — Add swipe-to-delete on food entries

**Problem:** Mobile users expect swipe gestures on list items. Currently requires tapping a tiny icon button.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** Add horizontal swipe detection on each food entry row (same pattern as `session-exercises.tsx` touch handlers). Swipe left reveals a red "Delete" button. Tapping it triggers the undo-delete flow from task 1.1. On first use, show a brief hint animation (like training overhaul task 2.3).

**Verify:** Swipe left on a food entry at 375px viewport, confirm delete button revealed.

---

## Phase 2: Mobile-First Input Redesign

Skill focus: `/adapt`, `/distill`, `/frontend-design`

**Use Opus model for this phase.**

### 2.1 — Enlarge all touch targets to iOS minimum

**Problem:** Multiple interactive elements are below Apple's 44px minimum:
- "Add" buttons in meal headers: `px-2 py-1` (~28px)
- "Copy from yesterday": `px-2.5 py-0.5` (~28px)
- Recent food chips: `px-3 py-1` (~28px)
- Gram estimator chips: `px-2.5 py-0.5` (~28px)
- Date nav chevrons: `p-1.5` (~32px)
- Grocery list checkboxes: `size-4` (16px)
- Macro target form buttons: `size="sm"` (h-7 = 28px)
- "Cal only" toggle: `text-[11px]` (~22px)

**Files:** `components/diet/diet-log-view.tsx`, `components/diet/add-food-form.tsx`, `components/diet/grocery-list.tsx`, `components/diet/macro-target-form.tsx`

**Action:** Audit every interactive element and enforce minimum `h-10` (40px) on mobile for buttons and `h-11` (44px) for primary actions. Specific fixes:
- Meal header "Add" buttons: `px-3 py-2` minimum
- Date nav chevrons: `p-2.5` minimum
- Recent food chips: `px-4 py-2` with `touch-manipulation`
- Gram estimator chips: `px-3 py-1.5` minimum
- Grocery checkboxes: `size-5` with larger tap area via padding
- Macro target buttons: `size="default"` on mobile

**Verify:** Playwright at 375x812 — screenshot each area and visually confirm no element is smaller than ~40px tap target.

---

### 2.2 — Add haptic feedback to stepper interactions

**Problem:** The macro stepper buttons (±) in AddFoodForm use `onPointerDown` with 120ms repeat interval but have no tactile feedback. On mobile, there's no physical confirmation of each increment.

**Files:** `components/diet/add-food-form.tsx`

**Action:** Add `navigator.vibrate?.(10)` on each stepper press (single short pulse). Add `navigator.vibrate?.(5)` on hold-repeat ticks. Wrap in feature detection so it's silent on browsers without Vibration API. Also add `active:scale-95` visual feedback on stepper buttons and increase the repeat rate from 120ms to 80ms for snappier feel.

**Verify:** Test on a real mobile device (or confirm via code review that vibrate calls exist). Playwright: hold a stepper button and confirm visual scale feedback.

---

### 2.3 — Add swipe gesture to date navigator

**Problem:** Changing dates requires tapping small chevron arrows. On mobile, swiping left/right to navigate days is the natural gesture.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** Add horizontal swipe detection on the main content area (below the view toggle, above the meal sections). Swipe right = previous day, swipe left = next day. Use a 50px minimum threshold to avoid conflicts with vertical scroll. Add a subtle slide transition on the content when swiping. Keep chevron buttons as fallback.

**Verify:** Playwright: swipe right on the diet view, confirm date changes to previous day.

---

### 2.4 — Upgrade mobile macro visualization

**Problem:** MacroRings on mobile shows tiny progress bars (`sm:hidden` hides the SVG rings on mobile). The primary use context (phone, mid-meal) gets the worst visual experience.

**Files:** `components/diet/macro-rings.tsx`

**Action:** Replace the thin mobile progress bars with compact mini-rings — 48px diameter SVG circles with the consumed value centered. These are smaller than desktop rings (80px) but far richer than flat bars. Use the same stroke-based animation. Layout as `grid-cols-4 gap-2` on mobile. If space is too tight on very small screens (<360px), fall back to a single horizontal segmented bar showing all four macros as colored segments with numbers above.

**Verify:** Playwright at 375x812 and 320x568 (iPhone SE 1st gen) — confirm rings render properly.

---

### 2.5 — Improve calories-only mode discoverability

**Problem:** The "Cal only" toggle in AddFoodForm is `text-[11px]` (~22px) — nearly invisible. Users who just want to track calories without full macro breakdown don't discover this shortcut.

**Files:** `components/diet/add-food-form.tsx`

**Action:** Replace the tiny text toggle with a segmented control at the top of the macro section: "Full macros" | "Calories only". Use `rounded-lg border border-border bg-muted p-1` container with two buttons. Active state: `bg-background shadow-sm`. When "Calories only" is active, hide protein/carbs/fat steppers entirely and center the calories stepper prominently with larger text.

**Verify:** Playwright: toggle to "Calories only" mode and confirm macro steppers hide, calories input is prominent.

---

### 2.6 — Normalize macro colors across all components

**Problem:** Macro colors are inconsistent: Calories are amber in form stepper labels but indigo in rings. Carbs are sky in form, amber in rings. Fat is orange in form, rose in rings.

**Files:** `components/diet/add-food-form.tsx`, `components/diet/macro-rings.tsx`, `components/diet/diet-log-view.tsx`, `lib/label-colors.ts`

**Action:** Standardize everywhere to the MACRO_COLORS defined in `lib/label-colors.ts`:
- Calories: indigo
- Protein: emerald
- Carbs: amber
- Fat: rose

Audit every component that renders macro colors and ensure they reference `MACRO_COLORS` from the single source of truth. Remove any inline color overrides.

**Verify:** Screenshot macro rings, stepper labels, pie chart, history chart — confirm all four macros use consistent colors.

---

## Phase 3: Information Architecture & Flow

Skill focus: `/arrange`, `/distill`, `/onboard`

**Use Opus model for this phase.**

### 3.1 — Restructure the meal logging flow to minimize taps

**Problem:** Current flow: tap "Add" on meal header → bottom sheet opens → search/type food → fill macros → submit. The "Add" buttons are small and buried in meal section headers. Total: 5-8 taps per meal.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** Add a persistent floating action button (FAB) at the bottom-right of the diet view: large (56px), primary color, `Plus` icon. Tapping opens AddFoodForm with the meal type auto-detected from current time. This makes the primary action always one tap away regardless of scroll position. Keep the per-meal "Add" buttons for users who want to specify meal type explicitly, but make them secondary.

**Verify:** Playwright at 375x812 — confirm FAB is visible, doesn't overlap bottom nav, and opens the form with correct auto-detected meal type.

---

### 3.2 — Make recent foods more prominent and larger

**Problem:** Recent foods carousel is a horizontal scroll with `scrollbar-none` — easy to miss. Chips are small (`px-3 py-1`). This is the fastest logging path (1 tap) but it's buried.

**Files:** `components/diet/diet-log-view.tsx`

**Action:**
1. Move recent foods section above the meal groups (below macro rings, above meal cards)
2. Add a section header: "Quick Add" with the number of available items
3. Increase chip size to `px-4 py-2.5 text-sm` with `rounded-full` for easy thumb tapping
4. Show the food's calorie count as a subtle badge on each chip: `+ Chicken Breast · 165 kcal`
5. Add gradient fade on right edge when content overflows
6. Limit to 6 items on mobile (less scrolling needed)

**Verify:** Playwright at 375x812 — confirm recent foods are prominent, chips are thumb-sized, and calorie badges are visible.

---

### 3.3 — Design meaningful empty state with prominent CTA

**Problem:** When no entries exist for a date, there's no welcoming guidance. The "Add" buttons are small and non-obvious for first-time users.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** When entries for the selected date are empty, replace the meal groups section with a centered empty state:
- Utensils icon (muted, `size-10`)
- "No meals logged" title
- "Tap + to add your first meal" subtitle
- Large prominent "Add Meal" button (full-width on mobile, `size="lg"`)
- Below: "Copy from yesterday" button if previous day has entries
- Use `animate-fade-up` entrance

Keep the macro rings visible (showing all zeros) so users see the targets they're working toward.

**Verify:** Navigate to a date with no entries, confirm empty state renders with prominent CTA.

---

### 3.4 — Add loading skeleton for date navigation

**Problem:** `isDateLoading` state exists but isn't shown visually. When tapping a date chevron or swiping, the content just freezes until data loads.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** When `isDateLoading` is true, replace the meal groups section with skeleton cards matching the meal group layout: 4 skeleton cards (one per meal type) with 2-3 skeleton entry rows each. Keep macro rings visible but show skeleton values. Use `animate-pulse` matching `app/diet/loading.tsx` patterns.

**Verify:** Throttle network in Playwright, change date, confirm skeletons render during load.

---

### 3.5 — Convert templates panel to proper bottom sheet

**Problem:** The templates panel is rendered inline in the view with a fixed position — not a proper bottom sheet. No drag-to-dismiss, no proper backdrop.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** Wrap the templates UI in the existing `BottomSheet` component (already used for AddFoodForm). Add:
- Drag handle at top
- Backdrop overlay
- Snap points (50% and 90% of viewport height)
- Template items with larger touch targets (`py-3` per item)
- "Apply" buttons at `size="default"` minimum

**Verify:** Open templates panel on mobile, confirm drag-to-dismiss works and items are easy to tap.

---

### 3.6 — Add view transition for Today/History toggle

**Problem:** Switching between Today and History views is an abrupt content swap — no animation, no sense of direction.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** Add a horizontal slide transition: switching to History slides content left, switching to Today slides content right. Use CSS `transition: transform 200ms ease-out, opacity 200ms ease-out` with a simple opacity cross-fade. Keep it fast (200ms) per "speed over ceremony" principle.

**Verify:** Toggle between Today and History, confirm smooth transition.

---

## Phase 4: Visual Polish & Tactile Feel

Skill focus: `/colorize`, `/delight`, `/animate`, `/typeset`

### 4.1 — Make calorie budget bar color-adaptive

**Problem:** The calorie budget bar is a static color regardless of progress. No visual urgency as the user approaches or exceeds their target.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** Transition bar color based on percentage of target:
- 0-70%: indigo (brand default)
- 70-90%: emerald (on track)
- 90-100%: amber (approaching limit)
- 100%+: rose (over target)

Use `transition-colors duration-500` for smooth color shifts. Add a subtle pulse animation when crossing 100%.

**Verify:** Log enough food to exceed 100% of calorie target, confirm bar transitions through all color stages.

---

### 4.2 — Fix pie chart interaction on mobile

**Problem:** Recharts hover-based tooltips don't work on touch devices. The macro split pie chart is unreadable on mobile.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** On mobile (detect via pointer media query or screen width):
- Replace hover tooltip with always-visible percentage labels on each pie segment
- Or use `onClick` handler to show/highlight the tapped segment with its details
- Consider replacing pie chart with a horizontal stacked bar on mobile (simpler, clearer at small sizes)

**Verify:** Tap pie chart segments on mobile viewport, confirm data is readable.

---

### 4.3 — Fix history stats overflow on small screens

**Problem:** 3-column grid for history stats (Avg Daily Kcal, Avg Protein, On Target days) overflows on iPhone SE (375px) with text truncation.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** Use `grid-cols-3 gap-2` with `text-center` and ensure all stat values use `tabular-nums text-sm` for consistent width. If the container is still too tight, switch to `grid-cols-1 divide-y` on screens under 360px (`min-[360px]:grid-cols-3`). Add `truncate` on labels as safety.

**Verify:** Playwright at 320x568 (iPhone SE 1st gen) — confirm no overflow.

---

### 4.4 — Improve TDEE weight editing UX

**Problem:** The TDEE card has a clunky inline text input with a tiny "OK" button (`px-2 py-1`) for editing body weight.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** Replace with a compact stepper pattern: tapping the weight value opens a small inline stepper (−1 / value / +1) with 0.5kg increments. Auto-saves after 1 second of inactivity (no "OK" button needed). Add `blur` save as fallback. Use the same stepper visual pattern as macro steppers for consistency.

**Verify:** Tap weight in TDEE card, confirm stepper appears with ±0.5 increments.

---

### 4.5 — Enhance multiplier buttons with serving context

**Problem:** Serving size multiplier buttons (0.5x, 1x, 1.5x, 2x, 3x) don't show what the resulting amount will be. User can't preview before committing.

**Files:** `components/diet/add-food-form.tsx`

**Action:** Below each multiplier button, show the resulting serving size in muted small text: e.g., "= 170g" for 2x of an 85g serving. Only show when a base food is selected (i.e., `baseFood` exists). Use `text-[10px] text-muted-foreground` to keep it subtle.

**Verify:** Select a food from search, confirm multiplier buttons show resulting amounts.

---

### 4.6 — Add meal section micro-interactions

**Problem:** Meal sections (Breakfast, Lunch, Dinner, Snack) are static cards with no interactivity beyond the "Add" button. They don't invite interaction.

**Files:** `components/diet/diet-log-view.tsx`

**Action:**
- Add `active:scale-[0.98]` on the meal header tap area for tactile feedback
- When a new entry is added to a meal, animate it in with `animate-fade-up` (staggered from existing entries)
- Add a subtle count badge next to the meal icon showing entry count when > 0
- Use the meal type color from `MEAL_TYPE_STYLES` for a thin left border accent on each meal card

**Verify:** Add a food entry, confirm it animates in. Confirm meal cards have colored left borders.

---

## Phase 5: Accessibility & Edge Cases

Skill focus: `/harden`

### 5.1 — Add ARIA attributes to custom controls

**Problem:** The food search combobox lacks proper ARIA roles. The macro stepper buttons have no `aria-label`. The view toggle (Today/History) has no `role="tablist"`.

**Files:** `components/diet/food-search.tsx`, `components/diet/add-food-form.tsx`, `components/diet/diet-log-view.tsx`

**Action:**
- Food search: Add `role="combobox"`, `aria-expanded`, `aria-activedescendant`, `role="listbox"` on dropdown, `role="option"` on items
- Macro steppers: Add `aria-label="Decrease {macro}"` / `aria-label="Increase {macro}"` on ± buttons
- View toggle: Add `role="tablist"` on container, `role="tab"` + `aria-selected` on each tab
- Date navigator: Add `aria-label="Previous day"` / `aria-label="Next day"` on chevrons

**Verify:** Tab through the diet view with Playwright, confirm focus rings visible on all interactive elements.

---

### 5.2 — Handle offline state for diet logging

**Problem:** All diet mutations require server round-trips. If the user loses connectivity while logging a meal (common in kitchens with poor reception), the action fails silently.

**Files:** `components/diet/diet-log-view.tsx`, `components/diet/add-food-form.tsx`

**Action:** Add `navigator.onLine` check before mutations. If offline:
- Show amber banner at top: "You're offline — entries will be saved when you reconnect"
- Queue the entry in localStorage under `kifted_offline_diet_queue`
- On reconnection (`online` event), process the queue and show toast: "Synced {n} entries"

**Verify:** Use Playwright network conditions to go offline, add a food entry, go online, confirm sync.

---

### 5.3 — Prevent iOS zoom on input focus

**Problem:** Several inputs use `text-sm` (14px) which triggers iOS Safari auto-zoom when focused. The user gets zoomed in and has to pinch-zoom out.

**Files:** `components/diet/add-food-form.tsx`, `components/diet/food-search.tsx`, `components/diet/macro-target-form.tsx`, `components/diet/supplement-log-view.tsx`

**Action:** Ensure all `<input>` and `<select>` elements use `text-base` (16px) minimum on mobile. Apply via a utility class: `text-base sm:text-sm` — full 16px on mobile, compact 14px on desktop. Also ensure all inputs have `inputMode` set appropriately: `"decimal"` for macro values, `"numeric"` for barcode/calories-only, `"text"` for food names.

**Verify:** Playwright at 375x812 — focus each input and confirm no zoom occurs.

---

### 5.4 — Fix sticky macro summary bar iOS overlap

**Problem:** The sticky macro summary bar uses `sticky top-14` which can conflict with iOS Safari's dynamic toolbar collapse, causing the bar to overlap content or get hidden.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** Use `sticky top-[calc(3.5rem+env(safe-area-inset-top))]` to account for the safe area. Add `z-20` to ensure it stays above content. Add a subtle bottom shadow (`shadow-sm`) when stuck to create visual separation from scrolled content.

**Verify:** Scroll the diet page on iOS Safari viewport, confirm summary bar stays correctly positioned.

---

### 5.5 — Add keyboard shortcuts for fast logging

**Problem:** No keyboard shortcuts exist. Desktop users logging meals while at a computer want keyboard-driven flow.

**Files:** `components/diet/add-food-form.tsx`, `components/diet/diet-log-view.tsx`

**Action:**
- `Enter` in food search to select first result and auto-fill
- `Tab` from food name → calories → protein → carbs → fat → submit (natural flow)
- `Escape` to close AddFoodForm bottom sheet
- `Cmd/Ctrl + Enter` to submit the form from any field
- Number keys `1-4` to select meal type when form is open (1=breakfast, 2=lunch, 3=dinner, 4=snack)

**Verify:** Use Playwright keyboard commands to complete a full food logging flow without mouse.

---

## Phase 6: Desktop Experience

Skill focus: `/adapt`, `/arrange`

### 6.1 — Two-column layout for diet dashboard

**Problem:** On desktop (1024px+), the diet view renders as a single narrow column. The macro summary and meal groups could sit side-by-side.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** At `lg:` breakpoint, render a two-column layout:
- Left column (sticky): Macro rings, calorie budget bar, TDEE card, pie chart, recent foods
- Right column (scrollable): Meal groups with entries, templates button, macro target form

Use `lg:grid lg:grid-cols-[340px_1fr] lg:gap-8` with `lg:sticky lg:top-20` on the left column.

**Verify:** Playwright at 1280x800 — confirm two-column layout with sticky left panel.

---

### 6.2 — Inline food form on desktop

**Problem:** On desktop, the AddFoodForm opens in a bottom sheet (designed for mobile). On wide screens, it should render inline or as a side panel.

**Files:** `components/diet/diet-log-view.tsx`, `components/diet/add-food-form.tsx`

**Action:** At `lg:` breakpoint, render AddFoodForm as an inline card at the top of the right column (above meal groups) instead of a bottom sheet. Add a slide-down animation on open and slide-up on close. Keep the bottom sheet behavior on mobile.

**Verify:** Open AddFoodForm on desktop, confirm it renders inline (not as modal/sheet).

---

### 6.3 — Desktop hover interactions on meal entries

**Problem:** Edit/delete buttons on food entries are always visible on mobile but could use hover-reveal on desktop for cleaner aesthetics.

**Files:** `components/diet/diet-log-view.tsx`

**Action:** On desktop (`sm:` and up): hide edit/delete buttons by default, reveal on hover with `opacity-0 group-hover:opacity-100 transition-opacity`. On mobile: keep always visible (current behavior). This reduces visual clutter on desktop while maintaining mobile accessibility.

**Verify:** Hover over a food entry on desktop viewport, confirm buttons appear smoothly.

---

### 6.4 — Widen history charts on desktop

**Problem:** Diet history chart renders at the same constrained width on all viewports. On desktop, it has excessive whitespace.

**Files:** `components/diet/diet-history-chart.tsx`, `components/diet/diet-log-view.tsx`

**Action:** Use `max-w-none` on the chart container at `lg:` breakpoint. Increase chart height from 220px to 300px on desktop for better readability. Show more detailed x-axis labels (full day names instead of abbreviations).

**Verify:** Playwright at 1280x800 — confirm chart fills available width with taller height.

---

## Post-flight

1. Take Playwright screenshots of all diet pages at **both 375x812 and 1280x800** as "after" images.
2. Run `npx tsc --noEmit` to verify no TypeScript errors.
3. Run `npm run lint` and fix any warnings.
4. Compare before/after screenshots and summarize all changes with file paths.

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
