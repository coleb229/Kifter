"use client";

import { useEffect, useState } from "react";

interface SubnavItem {
  label: string;
  id: string;
}

interface Props {
  items: SubnavItem[];
  stickyTop?: string;
}

export function SectionSubnav({ items, stickyTop = "top-14" }: Props) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveId(e.target.id);
        });
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0 }
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [items]);

  return (
    <>
      {/* Mobile/tablet: horizontal sticky strip */}
      <nav className={`xl:hidden sticky ${stickyTop} z-40 -mx-4 mb-2 flex gap-1 overflow-x-auto border-b border-border bg-background/90 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8`}>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeId === item.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {/* Desktop: fixed vertical left nav */}
      <nav className="hidden xl:flex fixed left-5 top-1/2 -translate-y-1/2 z-20 flex-col gap-0.5">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={`group relative py-1.5 pr-1 text-xs transition-colors duration-200 ${
                isActive
                  ? "font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
              <span
                className={`absolute bottom-0.5 left-0 h-px transition-[width] duration-300 ease-out ${
                  isActive
                    ? "w-full bg-foreground/60"
                    : "w-0 bg-foreground/30 group-hover:w-full"
                }`}
              />
            </a>
          );
        })}
      </nav>
    </>
  );
}
