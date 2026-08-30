"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export const ADMIN_THEME_KEY = "gr-admin-theme";
/** Id of the wrapper element the (dashboard) layout renders. */
export const ADMIN_ROOT_ID = "gr-admin";

/**
 * Toggles the `dark` class on the admin root wrapper and persists the choice.
 * The (dashboard) layout applies the stored theme before paint via an inline
 * script, so this component only needs to sync after mount.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const root = document.getElementById(ADMIN_ROOT_ID);
    setTheme(root?.classList.contains("dark") ? "dark" : "light");
    setMounted(true);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    const root = document.getElementById(ADMIN_ROOT_ID);
    root?.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(ADMIN_THEME_KEY, next);
    } catch {
      // storage unavailable — theme still applies for this page view
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className="rounded-xl p-2 text-muted transition-colors hover:bg-black/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
    >
      {/* Render both until mounted to avoid a hydration mismatch flash */}
      {!mounted || theme === "dark" ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
    </button>
  );
}
