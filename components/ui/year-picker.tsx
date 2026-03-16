interface Props {
  years: number[];
  selectedYear: number;
  onChange: (year: number) => void;
}

export function YearPicker({ years, selectedYear, onChange }: Props) {
  if (years.length <= 1) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {years.map((y) => (
        <button
          key={y}
          type="button"
          onClick={() => onChange(y)}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            y === selectedYear
              ? "bg-primary text-primary-foreground shadow"
              : "border border-border bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {y}
        </button>
      ))}
    </div>
  );
}
