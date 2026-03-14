"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label="Toggle theme" disabled />;
  }

  function cycleTheme() {
    if (theme === "system") setTheme("light");
    else if (theme === "light") setTheme("dark");
    else setTheme("system");
  }

  const icon =
    theme === "system" ? (
      <Monitor className="size-4" />
    ) : resolvedTheme === "dark" ? (
      <Moon className="size-4" />
    ) : (
      <Sun className="size-4" />
    );

  const label =
    theme === "system"
      ? "System theme"
      : theme === "light"
      ? "Light theme"
      : "Dark theme";

  return (
    <Button variant="ghost" size="icon" onClick={cycleTheme} aria-label={label}>
      {icon}
    </Button>
  );
}
