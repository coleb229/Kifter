import { Dumbbell, Target, Utensils } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

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

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden px-4 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute left-1/2 top-1/3 h-150 w-150 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl animate-fade-up">
            Your fitness,{" "}
            <span className="text-primary">tracked.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg lg:text-xl animate-fade-up" style={{ animationDelay: "100ms" }}>
            Log progressive overload, hit your macros, track cardio, and monitor
            your goals — all in one focused place.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row animate-fade-up" style={{ animationDelay: "200ms" }}>
            <Button size="lg" className="px-8" render={<a href="#" />}>
              Get Started
            </Button>
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
