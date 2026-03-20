"use client";

interface SubnavItem {
  label: string;
  id: string;
}

interface Props {
  items: SubnavItem[];
}

export function SectionSubnav({ items }: Props) {
  return (
    <nav className="sticky top-0 z-10 -mx-4 mb-10 flex gap-1 overflow-x-auto border-b border-border bg-background/90 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="shrink-0 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
