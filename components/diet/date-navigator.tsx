"use client";

import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { format, parseISO, addDays, subDays } from "date-fns";

interface Props {
  selectedDate: string;
  isToday: boolean;
  isDateLoading: boolean;
  isCopying: boolean;
  hasEntries: boolean;
  onChangeDate: (date: string) => void;
  onCopyYesterday: () => void;
}

export function DateNavigator({ selectedDate, isToday, isDateLoading, isCopying, hasEntries, onChangeDate, onCopyYesterday }: Props) {
  return (
    <div className="flex items-center gap-2 animate-fade-up">
      <button
        type="button"
        onClick={() => onChangeDate(format(subDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))}
        disabled={isDateLoading}
        className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        aria-label="Previous day"
      >
        <ChevronLeft className="size-5" />
      </button>
      <span className="text-sm font-semibold min-w-32 text-center">
        {isToday ? "Today" : format(parseISO(selectedDate), "EEE, MMM d")}
      </span>
      <button
        type="button"
        onClick={() => onChangeDate(format(addDays(parseISO(selectedDate), 1), "yyyy-MM-dd"))}
        disabled={isDateLoading || isToday}
        className="rounded-lg p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
        aria-label="Next day"
      >
        <ChevronRight className="size-5" />
      </button>
      {!isToday && (
        <button
          type="button"
          onClick={() => onChangeDate(format(new Date(), "yyyy-MM-dd"))}
          className="ml-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Today
        </button>
      )}
      {!hasEntries && (
        <button
          type="button"
          onClick={onCopyYesterday}
          disabled={isCopying}
          className="ml-auto flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <Copy className="size-3" />
          {isCopying ? "Copying…" : "Copy from yesterday"}
        </button>
      )}
    </div>
  );
}
