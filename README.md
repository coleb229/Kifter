# Kifted

A personal fitness tracking app for logging progressive overload, nutrition, cardio, and goals. Built for a small group of friends who want a fast, clean, mobile-first experience.

---

## Features

### Currently Implemented

- **Authentication** — Google OAuth via NextAuth v5. Sessions stored as JWT. User records persisted in MongoDB. Live role fetching on every session check (no stale permissions after role changes).
- **Theme** — Light / Dark / System preference toggle. Persists across sessions.
- **Roles & Access Control** — Three-tier role system: `admin`, `member`, `restricted`. Admins manage all users from the admin panel; restricted users lose access to Community.
- **Training Tracker**
  - Create a workout session with a name, date, body target (Push / Pull / Legs / etc.), and optional notes
  - Add exercises to a session with per-set weight and rep logging
  - Weight unit stored per set (kg / lb) — unit persists alongside the weight value; no conversion ambiguity
  - Default unit is lb; unit preference is remembered per exercise (snaps to last-used unit on select)
  - Exercise dropdown populated from a per-user list (default exercises + custom additions)
  - Custom exercise management at `/training/exercises` — add or remove exercises from your list
  - Weight fields auto-fill with the last recorded weight when selecting an existing exercise
  - Full CRUD: edit/delete sessions (with confirmation), rename/delete exercises, edit/delete individual sets inline
  - Session list showing recent workouts with body target badge, exercise summary, and set count
- **Analytics** — Per-exercise progress charts at `/training/analytics`; three visualization modes (Max Weight area chart, Volume bar chart, Reps line chart); stat cards for Personal Record, sessions, total volume, and avg reps; exercise selector with client-side data fetching
- **Community Feed** — Shared post feed at `/community`; two post types (Progress Update / General); per-user delete; admins can delete any post; restricted users see a locked view
- **User Settings**
  - Profile at `/settings/profile`: display name, bio (up to 280 chars), custom profile photo via UploadThing (overrides Google avatar)
  - Preferences at `/settings/preferences`: default weight unit (lb / kg) stored in user document
- **Admin Panel** — User management at `/admin` (admin-only); view all users; change roles via dropdown; ban/unban with timestamped `bannedAt` field; own row is protected from self-demotion or self-ban
- **Landing page** — Animated hero: slow-moving floating gradient orbs on desktop (right-anchored), breathing glow pulse on mobile; auth-aware CTA (Go to Dashboard for signed-in users, Get Started Free for guests)

### Planned

- Nutrition / macro tracking
- Cardio logging
- Goals and progress milestones

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI primitives | @base-ui/react |
| Auth | NextAuth v5 (Google provider) |
| Database | MongoDB (Atlas) |
| File uploads | UploadThing |
| Deployment | Vercel |

---

## Project Structure

```
app/
  page.tsx                  # Landing page (animated hero, auth-aware CTA)
  layout.tsx                # Root layout (SessionProvider, ThemeProvider)
  training/
    layout.tsx              # Auth-guarded training layout
    page.tsx                # Session list
    new/page.tsx            # New session form
    [id]/page.tsx           # Session detail + exercise logger
    analytics/page.tsx      # Per-exercise progress charts
    exercises/page.tsx      # Exercise list management
  settings/
    layout.tsx              # Settings layout with Profile / Preferences tabs
    profile/page.tsx        # Display name, bio, profile photo upload
    preferences/page.tsx    # Default weight unit toggle
  admin/
    layout.tsx              # Admin-only guard (redirects non-admins)
    page.tsx                # User management table
  community/
    layout.tsx              # Auth + restricted-access guard
    page.tsx                # Post feed
    new/page.tsx            # Create post form
  api/
    auth/[...nextauth]/     # NextAuth route handler
    uploadthing/            # UploadThing file router

components/
  navbar.tsx                # Auth-aware sticky nav with Community link
  theme-toggle.tsx          # Light/dark/system toggle
  user-menu.tsx             # Avatar + dropdown (Training, Community, Settings, Admin, Sign Out)
  ui/button.tsx             # Base button component
  training/
    session-card.tsx        # Session list card
    session-form.tsx        # Create session form
    session-exercises.tsx   # Exercise display — reads weightUnit per set
    exercise-logger.tsx     # Log exercise + sets; inline unit toggle; last-weight pre-fill
    exercise-manager.tsx    # Add / delete custom exercises
    weight-unit-toggle.tsx  # kg / lb toggle pill
    analytics-chart.tsx     # Recharts area/bar/line chart with mode toggle
  settings/
    profile-form.tsx        # Display name, bio, UploadButton for profile photo
    preferences-form.tsx    # Weight unit pill toggle
  admin/
    user-table.tsx          # Role select, ban/unban, "You" badge on own row
  community/
    post-card.tsx           # Author avatar, role badge, type chip, delete confirm
    create-post-form.tsx    # Post type selector, textarea with char counter

actions/
  auth-actions.ts           # signIn / signOut server actions
  workout-actions.ts        # createSession, addExerciseToSession, getWorkoutSessions, etc.
  analytics-actions.ts      # getExerciseAnalytics, getUserExercises
  user-actions.ts           # getCurrentUser, updateProfile, updatePreferences
  admin-actions.ts          # getAllUsers, setUserRole, toggleBan
  post-actions.ts           # createPost, getPosts, deletePost

lib/
  mongodb.ts                # MongoDB client singleton
  db.ts                     # Typed collection helpers (workouts, users, posts, etc.)
  weight.ts                 # kg ↔ lb conversion utilities
  exercises.ts              # DEFAULT_EXERCISES — edit to add app-wide defaults
  uploadthing.ts            # UploadThing file router (server)
  uploadthing-client.ts     # Typed UploadButton (client)

hooks/
  use-weight-unit.ts        # localStorage-backed unit preference hook

types/
  index.ts                  # Shared TypeScript interfaces (UserDoc, PostDoc, UserRole, etc.)
  next-auth.d.ts            # Session type augmentation (id, role)
```

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
AUTH_SECRET=          # npx auth secret
AUTH_GOOGLE_ID=       # Google Cloud Console OAuth client ID
AUTH_GOOGLE_SECRET=   # Google Cloud Console OAuth client secret
MONGODB_URI=          # MongoDB Atlas connection string
MONGODB_DB=Kifted     # Database name
UPLOADTHING_TOKEN=    # UploadThing dashboard → project → API key
```

---

## Admin Bootstrap

There is no signup flow for the admin role. To make yourself an admin:

1. Sign in once so your user document is created in MongoDB.
2. Open MongoDB Atlas → `Kifted` db → `users` collection → find your document.
3. Add (or set) the field `role: "admin"`.
4. Sign out and back in — the Admin Panel link will appear in your user menu.

You can then promote or restrict other users from `/admin`.

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Changelog

### 2026-03-14 (latest)
- Community feed at `/community` — Progress Update and General post types; chronological feed; per-user and admin delete
- User settings at `/settings/profile` (display name, bio, UploadThing profile photo) and `/settings/preferences` (default weight unit)
- Admin panel at `/admin` — role management (admin/member/restricted), ban/unban, self-protection on own row
- Animated landing page hero — floating gradient orbs on desktop, breathing glow on mobile; auth-aware CTA
- Role system: `admin | member | restricted`; live role fetched from DB on every session (no stale JWT role); restricted users locked out of Community
- Navigation updates: Community link in navbar + user menu; Admin Panel link in user menu (admin only); Settings link in user menu
- Fixed analytics chart axis label and grid rendering — replaced `hsl(var(--muted-foreground))` (unreliable in SVG paint attributes) with static colors
- Improved analytics chart palette — brighter 400-level colors for all three modes so charts are visible on dark card backgrounds

### 2026-03-14
- Site-wide entrance animations: fade-up with stagger on all list views (session cards, feature cards, analytics pills + stat cards)
- Button hover effects: scale 103% + brightness 110% on primary buttons, scale-only on outline/ghost; active press scales to 97%
- Custom `animate-fade-up` Tailwind utility added via `@utility` directive in globals.css

### 2026-03-14
- Analytics page at `/training/analytics` — per-exercise progress visualization
- Three chart modes: Max Weight (gradient area chart), Volume (bar chart), Reps (line chart with dots)
- Stat cards: Personal Record (with date), Sessions, Total Volume, Avg Reps per Set
- Exercise selector as scrollable pill tabs; switches exercises client-side via server action
- Unit normalization to lb for cross-unit volume/max weight comparisons
- "Analytics" button added to `/training` header

### 2026-03-14
- Full CRUD on workout sessions: inline edit (name, date, body target, notes) and delete with confirmation on the session detail page
- Full CRUD on exercises within a session: rename exercise inline, delete all sets for an exercise, edit individual sets (weight, unit, reps), delete individual sets — all with inline confirm flows
- "Add set" button at the bottom of each exercise group — opens an inline input row pre-filled with the last set's weight and unit for fast entry
- Delete session from the session list (trash icon appears on hover, with inline confirm)
- New server actions: `updateSession`, `deleteSession`, `updateSet`, `deleteSet`, `renameExercise`, `deleteExerciseFromSession`

### 2026-03-14
- Weight unit stored per set — `weightUnit` field added to `WorkoutSet` documents (backwards-compatible, defaults to `lb` for old records)
- Fixed weight unit toggle re-render: `ExerciseLogger` now manages unit state locally (single source of truth), eliminating the stale-display bug
- Default weight unit changed from kg to lb
- Exercise input replaced with a dropdown populated from a per-user exercise list
- Added `lib/exercises.ts` with default exercises (Bench Press, Bicep Curl, Assisted Pull-up, Leg Press) — edit this file to add app-wide defaults
- Added `userExercises` MongoDB collection for user-specific custom exercises
- Added `/training/exercises` page for managing custom exercises (add / delete)
- "Exercises" button added to the Training page header for quick access
- Weight fields in the exercise logger now pre-fill with the last recorded weight when an exercise is selected, and the unit toggle snaps to the unit used that session

### 2026-03-14
- Fixed Vercel build failure — TypeScript error in unused `workout-form.tsx` (referenced renamed server action)
- Removed unused `workout-form.tsx` and `add-exercise.tsx` (superseded by two-step session workflow)
- Switched to system sans-serif font site-wide
- Fixed layout double-import of Plus Jakarta Sans introduced by linter

### 2026-03-13
- Added kg / lb weight unit toggle — weights stored in kg, displayed with conversion; preference persists in localStorage
- Split workout logging into two steps: (1) create session with body target, (2) add exercises to session
- Added body target field to sessions (Push, Pull, Legs, Upper Body, Lower Body, Full Body, Core, Cardio, Other)
- Created `/training/[id]` session detail page with exercise display and inline exercise logger
- Fixed `Button` component `nativeButton` warning when used with `render={<Link>}`
- Set up NextAuth v5 split-config pattern to fix Edge runtime crypto error in middleware
- Switched session strategy to JWT to support Edge middleware
- Added route protection for `/training/*` via middleware
- Built progressive overload tracker: session list, new session form, exercise logging with dynamic set rows
- Added user avatar + dropdown menu (`@base-ui/react/menu` + `@base-ui/react/avatar`)
- Navbar now reflects auth state: loading skeleton → Sign In → user avatar
- Set up MongoDB collection helpers and typed server actions for workout CRUD
- Added NextAuth v5 session type augmentation for `user.id`

### 2026-03-12 — Initial Build
- Scaffolded Next.js 16 project with TypeScript, Tailwind CSS v4, @base-ui/react
- Built landing page: hero section, 3-feature grid (Strength & Cardio, Nutrition, Goals), footer
- Implemented light / dark / system theme toggle via next-themes
- Auth system: Google OAuth via NextAuth v5, MongoDB adapter, JWT sessions
- Set up MongoDB client singleton with HMR-safe dev caching
- Created sticky auth-aware Navbar with ThemeToggle and UserMenu
