"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  // Both icons render on the server; CSS picks one off the `.dark` class that
  // next-themes writes on <html>. No mounted flag, no hydration mismatch, and
  // no icon flash on first paint. The current theme is read from the DOM at
  // click time, which is an event handler and so safe to do.
  function toggle() {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Alternar entre tema claro e escuro"
      onClick={toggle}
    >
      <Sun className="hidden h-4 w-4 dark:block" />
      <Moon className="block h-4 w-4 dark:hidden" />
    </Button>
  );
}
