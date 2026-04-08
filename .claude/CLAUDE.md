# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Next.js dev server on localhost:3000
npm run build     # Production build
npm run lint      # ESLint
```

No test framework is configured. Linting is the primary code quality check. TypeScript check: `npx tsc --noEmit`.

Path alias: `@/*` maps to project root (e.g., `@/lib/db`, `@/actions/training-actions`).

## Architecture

**Kifted** is a fitness tracking PWA (Next.js 16 App Router, TypeScript, Tailwind v4, React 19) backed by MongoDB Atlas. It tracks progressive overload, nutrition, cardio, body composition, and goals.

### Data Flow

Client components → **Server Actions** (`/actions/*.ts`) → MongoDB (via `/lib/db.ts`). No ORM — uses the `mongodb` driver directly. All server actions return `ActionResult<T>` (`{success: true, data: T}` | `{success: false, error: string}`).

The mobile app uses a separate REST API at `/api/mobile/*` with JWT auth (`verifyMobileToken()`).

### Server Action Conventions

All action files follow this pattern:
1. `"use server"` directive at top
2. Auth check: `const session = await auth()` — return early if unauthenticated
3. Return `ActionResult<T>` (`{success: true, data: T}` | `{success: false, error: string}`)
4. Non-critical side effects are fire-and-forget: `void updateStreak()`, `void upsertDailyNutritionSummary()`
5. Admin actions use `requireAdmin()` helper that throws on non-admin role

### Database Access

`lib/db.ts` exports typed async getters per collection (e.g., `getSessionsCollection()` → `Collection<WorkoutSessionDoc>`). No global instances — each call gets a fresh typed reference. The underlying connection is a singleton via `lib/mongodb.ts` (global promise cache, maxPoolSize=10).

### Type Conventions (`types/index.ts`)

- `*Doc` interfaces — raw MongoDB documents (ObjectId, Date fields)
- Plain interfaces (e.g., `WorkoutSession`) — serialized for client (string ids, ISO date strings)
- `*Input` interfaces — form input shapes
- Constants as `const` arrays with derived union types: `BODY_TARGETS as const` → `type BodyTarget`
- Singleton documents use fixed `_id` patterns: site settings `_id: "global"`, AI usage `_id: "userId:YYYY-MM-DD"`

### Key Directories

- `/actions/` — All server-side mutations (~27 files). This is where business logic lives.
- `/app/` — App Router pages. Main sections: `/training`, `/cardio`, `/diet`, `/body`, `/goals`, `/community`, `/settings`, `/admin`.
- `/components/` — UI components grouped by feature (training/, cardio/, diet/, community/, etc.) plus shared UI in `/components/ui/`.
- `/lib/` — Utilities: `db.ts` (MongoDB client + collection helpers), `label-colors.ts` (body target / meal type color maps), `apple-health-client-parser.ts`, mobile auth, food database.
- `/types/index.ts` — All MongoDB document interfaces.
- `/hooks/` — `useFormPersistence` (localStorage form cache), `useWeightUnit`.

### Auth

NextAuth v5 with Google OAuth, JWT sessions. Roles: `admin`, `member`, `restricted`. **Roles are live-fetched from MongoDB on every session callback** — changes take effect immediately. Mobile auth exchanges Google ID tokens for 7-day Kifted JWTs at `/api/mobile/auth/google`.

### Key Patterns

- **No middleware.ts** — Auth checked per-action via `await auth()`.
- **Precomputed daily nutrition cache** — `dailyNutritionSummary` collection is upserted fire-and-forget after diet mutations for fast analytics.
- **Apple Health import** — Enriches existing training sessions (merges heart rate, duration, calories by date) rather than duplicating them. Cardio and weight create new records with date-based dedup.
- **Body target colors** in `lib/label-colors.ts` — Each workout category (Push, Pull, Legs, etc.) and meal type has a fixed color scheme with active/inactive pill variants and dark mode support.
- **Dashboard widgets** — Drag-and-drop layout persisted in user preferences. Charts lazy-load via IntersectionObserver.
- **AI features** — Claude API for deload suggestions, exercise substitutions, training insights, and guide synthesis. Rate-limited per-user and site-wide via `aiUsage` collection. Uses `jsonrepair` to handle malformed Claude JSON output.
- **Guide content pipeline** — Two-stage system: (1) `actions/guide-actions.ts` extracts structured content from YouTube videos (tries CC captions → video description → Supadata API), (2) `actions/published-guide-actions.ts` synthesizes multiple extractions into polished published guides via Claude. Stored in `trainingGuides` and `publishedGuides` collections.
- **File uploads** via UploadThing (profile photos, progress photos, screenshots).
- **Numeric inputs** use `type="text" inputMode="decimal"` (not `type="number"`) for iOS compatibility.
- **Weight storage** — always stored internally as kg; converted for display via `lib/weight.ts` (`toDisplay()` / `toKg()`). The `useWeightUnit` hook provides the user's preference (defaults to `lb`).
- **Form persistence** — `useFormPersistence({ key, values, reset, exclude })` saves drafts to localStorage with configurable TTL (1h/24h/7d). Call `clearDraft()` on successful submit before navigating away. Exclude stale fields like dates.
- **Server actions accept up to 200MB** bodies (configured in `next.config.ts`) for Apple Health imports.
- **Flat route structure** — no route groups. Dynamic routes: `/training/[id]`, `/cardio/[id]`. Nested subroutes under main sections (e.g., `/training/new`, `/training/analytics`).
- **PWA** — `@ducanh2912/next-pwa` generates service workers in production. Disabled in dev to avoid HMR conflicts.

### Shared UI Components (`components/ui/`)

- **`BottomSheet`** — Native `<dialog>` with mobile slide-up, drag-to-dismiss. Props: `{ open, onClose, title?, children }`.
- **`EmptyState`** — Dashed-border container with icon + title + description + optional action button.
- **`OnboardingTip`** — Dismissible tooltip backed by localStorage. Use for first-time feature hints.
- **Skeleton variants** — `Skeleton`, `CardSkeleton`, `StatCardSkeleton`, `ChartSkeleton`, `ListItemSkeleton` for loading states.

### Environment Variables

```
AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
MONGODB_URI, MONGODB_DB=Kifted
UPLOADTHING_TOKEN, ANTHROPIC_API_KEY
GROQ_API_KEY (optional), SUPADATA_API_KEY (optional)
```

## Design System

See `.impeccable.md` for full design context.

### Design Goals

Users open Kifted mid-workout, between sets, or while meal-prepping — every interaction must be fast and frictionless. The job: log data quickly, see progress clearly, stay consistent.

**Brand personality: Confident. Focused. Clean.** The app should feel like premium sports equipment, not a theme park. Evoke confidence ("I'm making progress") and calm focus ("I know exactly what to do next"). Never gamified (no streaks with flames, XP, badges, leaderboards), never corporate/patronizing.

**Design principles:**
1. **Speed over ceremony** — Logging a set or meal should take seconds. Reduce modals, minimize navigation depth, prefer inline editing.
2. **Color with purpose** — Use color to encode meaning (workout categories, meal types, progress direction), not decoration. Every color earns its place.
3. **Confidence through clarity** — Users always know where they are, what changed, what to do next. Strong visual hierarchy, no ambiguity.
4. **Solid UX over flashy UI** — Prioritize usability, accessibility, interaction quality. Animations are responsive and intentional, never slow.
5. **Scale-ready simplicity** — Patterns intuitive to new users without tutorials. Consistency across sections so learning one teaches the rest.

**Anti-references:** MyFitnessPal's ease-of-use for diet logging is a positive reference. Avoid gamification aesthetics and sterile corporate health app looks.

### Technical Design Tokens

- **Colors:** OKLCH-based with user-customizable accent (`data-accent`: indigo/violet/rose/emerald/amber). Use color to encode meaning, not decoration.
- **Tailwind v4:** Uses `@import "tailwindcss"` + `@theme inline` blocks in `globals.css` — no `tailwind.config.js`. Class names differ from v3: use `bg-linear-to-r` (not `bg-gradient-to-r`). Custom utilities defined with `@utility` directive.
- **Typography:** Geist font (slated for replacement with something more athletic/confident — geometric or humanist sans-serif with strong weight contrast).
- **Theme:** Light and dark modes, user-selectable. Dark mode is primary for gym use.
- **Layout:** Mobile-first, `max-w-6xl` containers, responsive padding `px-4 sm:px-6 lg:px-8`. Bottom nav on mobile (`sm:hidden`) with safe area support. Content padded `pb-16 sm:pb-0` to clear bottom nav.
- **Components:** Shadcn/base-nova + @base-ui/react. Buttons via CVA with hover scale (1.03) / active scale (0.97).
- **Animation:** `animate-fade-up` (0.4s ease-out) for page sections with staggered delays. Respect `prefers-reduced-motion`.
- **Border radius:** Base `--radius: 0.625rem` (10px) with proportional scale from `sm` (6px) to `4xl` (26px). Cards `rounded-xl`, buttons `rounded-lg`.
- **Accessibility:** WCAG AA target. Proper focus rings, aria attributes, keyboard navigation. 16px min font on mobile inputs to prevent iOS zoom.
