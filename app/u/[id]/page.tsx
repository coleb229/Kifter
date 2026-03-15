import { notFound } from "next/navigation";
import { Avatar } from "@base-ui/react/avatar";
import { Dumbbell, Utensils, Activity, CalendarDays, ShieldCheck, Scale } from "lucide-react";
import { getPublicProfile } from "@/actions/user-actions";
import { format, parseISO } from "date-fns";

function getInitials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPublicProfile(id);
  if (!result.success) notFound();

  const user = result.data;
  const displayName = user.displayName ?? user.name ?? "Kifted User";
  const avatarSrc = user.profileImage ?? user.image ?? undefined;
  const visibility = user.preferences?.profileVisibility;
  const showTraining     = visibility?.showTraining     ?? true;
  const showNutrition    = visibility?.showNutrition    ?? true;
  const showCardio       = visibility?.showCardio       ?? true;
  const showBodyMetrics  = visibility?.showBodyMetrics  ?? false;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      {/* Avatar + name */}
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Avatar.Root className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          <Avatar.Image src={avatarSrc} alt={displayName} className="size-full object-cover" />
          <Avatar.Fallback className="text-2xl font-semibold text-muted-foreground">
            {getInitials(displayName)}
          </Avatar.Fallback>
        </Avatar.Root>

        <div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
            {user.role === "admin" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                <ShieldCheck className="size-3" />
                Admin
              </span>
            )}
          </div>
          {user.createdAt && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays className="size-3" />
              Joined {format(parseISO(user.createdAt), "MMMM yyyy")}
            </p>
          )}
        </div>

        {user.bio && (
          <p className="max-w-md text-sm text-muted-foreground leading-relaxed">{user.bio}</p>
        )}
      </div>

      {/* Shared data sections */}
      <div className="grid gap-4 sm:grid-cols-3">
        {showTraining && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950/40">
              <Dumbbell className="size-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-medium">Training</p>
            <p className="text-xs text-muted-foreground">Workout logs shared</p>
          </div>
        )}
        {showNutrition && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/40">
              <Utensils className="size-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium">Nutrition</p>
            <p className="text-xs text-muted-foreground">Diet logs shared</p>
          </div>
        )}
        {showCardio && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-5 text-center">
            <div className="flex size-9 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-950/40">
              <Activity className="size-4 text-rose-600 dark:text-rose-400" />
            </div>
            <p className="text-sm font-medium">Cardio</p>
            <p className="text-xs text-muted-foreground">Cardio logs shared</p>
          </div>
        )}
        {!showTraining && !showNutrition && !showCardio && !showBodyMetrics && (
          <div className="col-span-3 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">This user hasn&apos;t shared any data publicly.</p>
          </div>
        )}
      </div>

      {/* Body metrics badge */}
      {showBodyMetrics && user.latestWeight && (
        <div className="mt-4 flex justify-center">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950/40">
              <Scale className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {user.latestWeight.weight} {user.latestWeight.weightUnit}
              </p>
              <p className="text-xs text-muted-foreground">
                Body weight · {format(parseISO(user.latestWeight.date), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
