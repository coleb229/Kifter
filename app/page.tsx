import { Suspense } from "react";
import { Dumbbell, Target, Utensils, ArrowRight } from "lucide-react";
import { auth } from "@/auth";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/actions/auth-actions";
import { UserOverview } from "@/components/dashboard/user-overview";
import { ChangelogTimeline } from "@/components/landing/changelog-timeline";

const features = [
  {
    icon: Dumbbell,
    title: "Strength & Cardio",
    description:
      "Log every set, rep, and session. Track progressive overload, estimate 1RM, and record runs or rides — all in one place.",
  },
  {
    icon: Utensils,
    title: "Nutrition",
    description:
      "Hit your macros and calorie targets. Daily logging with clear progress toward your goals.",
  },
  {
    icon: Target,
    title: "Goals",
    description:
      "Set targets for strength, weight, or cardio and track your progress over time with built-in analytics.",
  },
];

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Dashboard — authenticated users only, shown at top */}
        {session && (
          <Suspense
            fallback={
              <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="h-8 w-40 animate-pulse rounded-lg bg-muted mb-6" />
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="h-56 animate-pulse rounded-xl bg-muted" />
                  <div className="h-56 animate-pulse rounded-xl bg-muted" />
                </div>
              </div>
            }
          >
            <UserOverview />
          </Suspense>
        )}

        {/* Marketing page — unauthenticated users only */}
        {!session && (
          <>
            {/* Hero */}
            <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 text-center">

              {/* Desktop: flowing orbs from the right */}
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden sm:block">
                {/* Primary orb — large indigo */}
                <div className="animate-orb-a absolute -right-35 top-[12%] h-160 w-160 rounded-full bg-indigo-500/12 blur-[110px] dark:bg-indigo-400/10" />
                {/* Secondary orb — violet */}
                <div className="animate-orb-b absolute right-15 -top-25 h-105 w-105 rounded-full bg-violet-500/10 blur-[90px] dark:bg-violet-400/8" />
                {/* Accent — fuchsia undertone */}
                <div
                  className="animate-orb-a absolute -right-20 top-[55%] h-80 w-80 rounded-full bg-fuchsia-500/7 blur-[80px] dark:bg-fuchsia-400/6"
                  style={{ animationDelay: "-13s" }}
                />
              </div>

              {/* Mobile: centered breathing glow */}
              <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 sm:hidden">
                <div className="animate-mobile-breathe absolute left-1/2 top-1/2 h-105 w-105 rounded-full bg-indigo-500/18 blur-[90px] dark:bg-indigo-400/14" />
              </div>

              {/* Badge */}
              <div
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/80 px-4 py-1.5 text-sm font-medium text-indigo-700 backdrop-blur-sm dark:border-indigo-700/40 dark:bg-indigo-950/60 dark:text-indigo-300 animate-fade-up"
              >
                <span className="size-1.5 rounded-full bg-indigo-500 animate-pulse" />
                Built for serious progress
              </div>

              <h1
                className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl animate-fade-up"
                style={{ animationDelay: "80ms" }}
              >
                Your fitness,{" "}
                <span className="bg-linear-to-r from-indigo-500 via-violet-500 to-purple-500 bg-clip-text text-transparent">
                  tracked.
                </span>
              </h1>

              <p
                className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg lg:text-xl animate-fade-up"
                style={{ animationDelay: "160ms" }}
              >
                Log progressive overload, hit your macros, track cardio, and monitor
                your goals — all in one focused place.
              </p>

              <div
                className="mt-10 flex flex-col gap-3 sm:flex-row animate-fade-up"
                style={{ animationDelay: "260ms" }}
              >
                <form action={signInWithGoogle}>
                  <Button size="lg" type="submit" className="gap-2 px-8">
                    Get Started Free
                    <ArrowRight className="size-4" />
                  </Button>
                </form>
                <Button
                  variant="outline"
                  size="lg"
                  className="px-8"
                  render={<a href="#features" />}
                >
                  See Features
                </Button>
              </div>
            </section>

            {/* Features */}
            <section
              id="features"
              className="mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8"
            >
              <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Everything you need
                </h2>
                <p className="mt-3 text-muted-foreground sm:text-lg">
                  Built for people serious about progress.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {features.map(({ icon: Icon, title, description }, i) => (
                  <div
                    key={title}
                    className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 text-card-foreground animate-fade-up"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Changelog */}
            <ChangelogTimeline />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
          <span className="text-sm font-semibold">Kifted</span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Kifted. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
