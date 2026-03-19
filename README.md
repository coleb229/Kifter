# Kifted

A personal fitness tracking app for logging progressive overload, nutrition, cardio, and goals. Built for a small group of friends who want a fast, clean, mobile-first experience.

---

## Features

- **Authentication** — Google OAuth via NextAuth v5. Sessions stored as JWT. User records persisted in MongoDB. Live role fetching on every session check (no stale permissions after role changes).
- **Theme** — Light / Dark / System preference toggle. Persists across sessions.
- **Roles & Access Control** — Three-tier role system: `admin`, `member`, `restricted`. Admins manage all users from the admin panel; restricted users lose access to Community.
- **Dashboard** — Personalized landing page with drag-and-drop widget layout, workout streak milestone badges, and rest day suggestions based on muscle group recovery.
- **Training Tracker**
  - Create sessions with name, date, body target (Push / Pull / Legs / etc.), and optional notes
  - Log exercises with per-set weight, reps, and unit (kg / lb) — unit persists per exercise
  - Exercise dropdown from a per-user list (defaults + custom); weight fields pre-fill with last recorded weight
  - Full CRUD: edit/delete sessions, rename/delete exercises, edit/delete individual sets inline
  - Calendar view with color-coded body target badges and hover preview
  - Progressive overload auto-suggestions and deload week auto-scheduler
  - Exercise demo video links and exercise substitution AI suggestions
  - One-tap workout sharing to the community feed
  - Injury & soreness log with severity tracking
  - Training guides at `/training/guides`
- **Training Analytics** — Per-exercise progress charts (Max Weight / Volume / Reps); training frequency heatmap (GitHub-style, last 12 months); body target distribution chart; personal records timeline; AI insights; Apple Health training overlay (duration, heart rate, calories)
- **Cardio** — Log cardio sessions with activity type, duration, distance, and intensity; full CRUD; analytics with trend charts
- **Diet** — Log meals with calories and macros (protein / carbs / fat); food library search with Open Food Facts barcode scanner; community foods; AI nutrition recommendations
- **Goals** — Goal tracking at `/goals`
- **Body** — Body measurements and photo progress gallery at `/body`
- **Apple Health Import** — Upload Apple Health `.zip` or `export.xml`; cardio workouts import as new sessions; strength/HIIT/core workouts enrich existing training sessions with heart rate, duration, and calorie data (matched by calendar date)
- **Data Import / Export** — CSV export and import for workouts and diet history at `/settings/data`
- **Community Feed** — Shared post feed with Progress Update and General post types; per-user and admin delete; restricted users see a locked view
- **Social Challenges** — 30-day fitness challenges with leaderboards; opt-in community leaderboard ranked by weekly workout volume
- **User Settings** — Profile (display name, bio, UploadThing profile photo); preferences (default weight unit); integration settings (Apple Health toggle, file size limit, deduplication)
- **Admin Panel** — User management (role changes, ban/unban); AI rate limiting controls (site-wide and per-user); inline bug report and suggestion editing; Claude AI ideas panel (generate, accept, track improvement ideas by category)
- **Mobile Navigation** — Bottom navigation bar for mobile-first use

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Auth | NextAuth v5 (Google provider) |
| Database | MongoDB (Atlas) |
| File uploads | UploadThing |
| AI | Claude API (Anthropic) |
| Deployment | Vercel |

---

## Project Structure

```
app/
  page.tsx                    # Landing page (animated hero, auth-aware CTA)
  layout.tsx                  # Root layout (SessionProvider, ThemeProvider)
  training/
    page.tsx                  # Session list + calendar view
    new/page.tsx              # New session form
    [id]/page.tsx             # Session detail + exercise logger
    analytics/page.tsx        # Analytics dashboard (charts, heatmap, AI insights, AH chart)
    exercises/page.tsx        # Exercise list management
    guides/page.tsx           # Training guides
  cardio/
    page.tsx                  # Cardio session list
    new/page.tsx              # New cardio session
    [id]/page.tsx             # Cardio session detail
    analytics/page.tsx        # Cardio analytics
  diet/
    page.tsx                  # Diet log
  goals/
    page.tsx                  # Goal tracking
  body/
    page.tsx                  # Body measurements + photo gallery
  community/
    page.tsx                  # Post feed + social challenges
    new/page.tsx              # Create post
  settings/
    page.tsx                  # Integration settings (Apple Health)
    profile/page.tsx          # Display name, bio, profile photo
    preferences/page.tsx      # Default weight unit
    data/page.tsx             # CSV import/export + Apple Health import
  admin/
    page.tsx                  # User management + AI rate limiting
  api/
    auth/[...nextauth]/       # NextAuth route handler
    uploadthing/              # UploadThing file router

components/
  training/
    session-card.tsx          # Session list card (with Apple Health chips)
    analytics-dashboard.tsx   # Exercise progress charts
    training-heatmap.tsx      # GitHub-style frequency heatmap
    body-target-chart.tsx     # Muscle group distribution chart
    personal-records.tsx      # PR timeline
    apple-health-training-chart.tsx  # AH overlay chart
    ai-insights.tsx           # AI-generated training insights
    deload-recommendation.tsx # Deload week suggestion card
  cardio/
    cardio-analytics-dashboard.tsx
  diet/
    diet-log-view.tsx
    diet-history-chart.tsx
  ui/
    year-picker.tsx           # Year filter pill component

actions/
  workout-actions.ts          # Session/set CRUD, PRs, deload, body target distribution
  analytics-actions.ts        # Exercise history, Apple Health session data
  cardio-actions.ts           # Cardio CRUD
  diet-actions.ts             # Diet CRUD
  import-actions.ts           # CSV + Apple Health XML import
  export-actions.ts           # CSV export
  settings-actions.ts         # Integration settings (Apple Health config)

types/
  index.ts                    # Shared TypeScript interfaces
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
ANTHROPIC_API_KEY=    # Anthropic Console → API keys (for AI features)
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

### 2026-03-19 (latest)

**Bug Fixes**
- Admin panel now live-updates when a user submits a bug report or suggestion (was missing `revalidatePath('/admin')`)
- Diet history chart now uses dual y-axes — macro grams on the left, calorie target on the right (was on one scale, making the line invisible)
- Body page form inputs no longer overflow on iOS — added `min-w-0` to grid wrappers in body weight and physique views
- Macro number inputs now accept decimal values (added `step={0.1}` to all macro spinners and target form fields)
- User table in admin panel left-column padding corrected (was missing `pl-4`, breaking alignment with header)
- Admin can now edit bug report and suggestion content inline (title, description, steps, severity, image URLs)
- Training "Upper Body" sessions now correctly put Push and Pull sub-groups on recovery cooldown (bidirectional cascade in `getRestDaySuggestions`)

**New Features**
- Claude AI Ideas Panel in admin: generate improvement ideas by category (UI/UX, Performance, New Features, Mobile, Data & Analytics), accept to persist, manage status (accepted → in progress → done → declined)
- Dashboard: Training Load Volume widget (daily weight × reps bar chart, last 7 days) and Cardio Heart Rate Trend widget (avg BPM per session line chart, last 30 days) — both available in Customize mode
- Bug report form: optional "Related Reports" section to link related open bugs; related IDs shown in admin expanded view
- Mobile REST API: JWT-based API under `/api/mobile/*` covering training, cardio, nutrition, body weight, goals, exercises, and profile settings; Google token exchange at `/api/mobile/auth/google`

### 2026-03-15
- Fixed Apple Health training enrichment date matching — UTC timezone mismatch caused AH data to be applied to the wrong session (off by one day)

### 2026-03-14
- Apple Health import overhauled: strength/HIIT/core workouts now **enrich** existing training sessions with heart rate, duration, and calorie data rather than creating duplicate sessions; ZIP and raw XML both supported; removed body-target selection step
- Configurable Apple Health integration settings (enable/disable, file size limit, deduplication)
- Apple Health Training chart added to analytics page — duration, heart rate, and calorie trends per activity type
- Social 30-day fitness challenges with leaderboards
- Exercise substitution AI suggestions (Wand2 button on exercise rows)
- Injury and soreness log with severity tracking
- Personal records timeline and muscle group volume balance (body target distribution) chart
- One-tap workout sharing to community feed
- Body measurement photo progress gallery
- Exercise demo video links
- Progressive overload auto-suggestions
- Deload week auto-scheduler
- Mobile bottom navigation bar
- Custom drag-and-drop dashboard widget layout
- Food barcode scanner via Open Food Facts API
- Opt-in community leaderboard ranked by weekly workout volume
- AI nutrition recommendations on diet page
- Workout streak milestone badges on dashboard
- AI usage rate limiting — site-wide and per-user controls
- GitHub-style training frequency heatmap on analytics page
- Rest day suggestions based on muscle group recovery
- Major preferences, admin panel, and mobile layout improvements
- Default exercise weight pre-fills from user's all-time highest recorded weight
- Color-coded body target badges across list and calendar views; calendar hover preview
- Cardio section with full CRUD, analytics, and dashboard integration
- Food library search, community foods
- Diet logging, landing dashboard
- Training guides section, calendar view, AI insights, and analytics improvements

### 2026-03-13
- Community feed with Progress Update and General post types; per-user and admin delete
- User settings: profile (display name, bio, UploadThing photo) and preferences (weight unit)
- Admin panel: role management, ban/unban, self-protection
- Animated landing page hero (floating orbs on desktop, breathing glow on mobile); auth-aware CTA
- Analytics page: per-exercise progress charts (Max Weight / Volume / Reps), stat cards, exercise selector
- Full CRUD for sessions, exercises, and sets; exercise dropdown with last-weight pre-fill; per-set weight unit

### 2026-03-12 — Initial Build
- Scaffolded Next.js project with TypeScript, Tailwind CSS v4
- Landing page, light/dark/system theme toggle
- Google OAuth via NextAuth v5, MongoDB Atlas, JWT sessions
- Sticky auth-aware navbar, progressive overload tracker
