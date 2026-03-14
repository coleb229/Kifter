# Kifted

A personal fitness tracking app for logging progressive overload, nutrition, cardio, and goals. Built for a small group of friends who want a fast, clean, mobile-first experience.

---

## Features

### Currently Implemented

- **Authentication** — Google OAuth via NextAuth v5. Sessions stored as JWT. User records persisted in MongoDB.
- **Theme** — Light / Dark / System preference toggle. Persists across sessions.
- **Training Tracker**
  - Create a workout session with a name, date, body target (Push / Pull / Legs / etc.), and optional notes
  - Add exercises to a session with per-set weight and rep logging
  - Weight unit toggle (kg / lb) — stored in kg, displayed in preferred unit. Preference persists in localStorage
  - Session list showing recent workouts with body target badge, exercise summary, and set count
- **Landing page** — Marketing page with hero section and feature overview

### Planned

- Nutrition / macro tracking
- Cardio logging
- Goals and progress analytics
- Charts for progressive overload over time

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
| Deployment | Vercel |
| Forms | React Hook Form + Zod |

---

## Project Structure

```
app/
  page.tsx                  # Landing page
  layout.tsx                # Root layout (SessionProvider, ThemeProvider)
  training/
    layout.tsx              # Auth-guarded training layout
    page.tsx                # Session list
    new/page.tsx            # New session form
    [id]/page.tsx           # Session detail + exercise logger
  api/auth/[...nextauth]/   # NextAuth route handler

components/
  navbar.tsx                # Auth-aware sticky nav
  theme-toggle.tsx          # Light/dark/system toggle
  user-menu.tsx             # Avatar + dropdown (Training link, Sign Out)
  ui/button.tsx             # Base button component
  training/
    session-card.tsx        # Session list card
    session-form.tsx        # Create session form
    session-exercises.tsx   # Exercise display with unit conversion
    exercise-logger.tsx     # Log exercise + sets to existing session
    weight-unit-toggle.tsx  # kg / lb toggle pill

actions/
  auth-actions.ts           # signIn / signOut server actions
  workout-actions.ts        # createSession, addExerciseToSession, getWorkoutSessions, getWorkoutSession

lib/
  mongodb.ts                # MongoDB client singleton
  db.ts                     # Typed collection helpers
  weight.ts                 # kg ↔ lb conversion utilities

hooks/
  use-weight-unit.ts        # localStorage-backed unit preference hook

types/
  index.ts                  # Shared TypeScript interfaces
  next-auth.d.ts            # Session type augmentation
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
```

---

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Changelog

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
