"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useThemeSchedule } from "@/contexts/theme-schedule-context";
import { resolveScheduledTheme, msUntilNextTransition } from "@/lib/theme-schedule";

/** Mounted once at the app root — applies the user's theme preference, and in "auto" mode schedules one precise timer per transition rather than polling. */
export function ThemeScheduler() {
  const { mode, lightTime, darkTime } = useThemeSchedule();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (mode !== "auto") {
      setTheme(mode);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout>;
    function apply() {
      const now = new Date();
      setTheme(resolveScheduledTheme(now, lightTime, darkTime));
      timeoutId = setTimeout(apply, msUntilNextTransition(now, lightTime, darkTime));
    }
    apply();

    return () => clearTimeout(timeoutId);
  }, [mode, lightTime, darkTime, setTheme]);

  return null;
}
