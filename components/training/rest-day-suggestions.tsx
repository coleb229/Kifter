import { CheckCircle2, Clock, BedDouble, HelpCircle } from "lucide-react";
import type { RestDaySuggestion } from "@/actions/workout-actions";

interface Props {
  suggestions: RestDaySuggestion[];
}

function formatHoursSince(hours: number): string {
  if (hours < 24) return `${Math.round(hours)}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const STATUS_CONFIG = {
  ready: {
    icon: CheckCircle2,
    iconClass: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800/40",
    label: "Ready",
    labelClass: "text-emerald-700 dark:text-emerald-400",
  },
  rest: {
    icon: BedDouble,
    iconClass: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800/40",
    label: "Rest",
    labelClass: "text-amber-700 dark:text-amber-400",
  },
  never: {
    icon: HelpCircle,
    iconClass: "text-muted-foreground",
    bg: "bg-muted/30",
    border: "border-border",
    label: "Untrained",
    labelClass: "text-muted-foreground",
  },
} as const;

export function RestDaySuggestions({ suggestions }: Props) {
  // Only show targets that have been trained recently (skip "never" for cleanliness unless all are never)
  const active = suggestions.filter((s) => s.recommendation !== "never");
  const display = active.length > 0 ? active : suggestions;

  return (
    <div className="mb-6 animate-fade-up" style={{ animationDelay: "80ms" }}>
      <div className="mb-3 flex items-center gap-2">
        <Clock className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold">Recovery Status</h2>
      </div>
      <div className="relative">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-border" style={{ maskImage: "linear-gradient(to right, black calc(100% - 2rem), transparent)" }}>
        {display.map((s) => {
          const cfg = STATUS_CONFIG[s.recommendation];
          const Icon = cfg.icon;
          return (
            <div
              key={s.bodyTarget}
              className={`flex min-w-[110px] shrink-0 flex-col gap-1 rounded-xl border border-l-3 p-3 ${cfg.bg} ${cfg.border}`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className={`size-3.5 shrink-0 ${cfg.iconClass}`} />
                <span className={`text-[11px] font-semibold ${cfg.labelClass}`}>{cfg.label}</span>
              </div>
              <p className="text-xs font-medium leading-tight">{s.bodyTarget}</p>
              <p className="text-[10px] text-muted-foreground">
                {s.hoursSince != null ? formatHoursSince(s.hoursSince) : "No data"}
              </p>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
