"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "auto";

const MODE_KEY = "e-mall-theme-mode";
const LIGHT_TIME_KEY = "e-mall-theme-light-time";
const DARK_TIME_KEY = "e-mall-theme-dark-time";

const DEFAULT_LIGHT_TIME = "07:00";
const DEFAULT_DARK_TIME = "19:00";

type ThemeScheduleValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  lightTime: string;
  darkTime: string;
  setSchedule: (lightTime: string, darkTime: string) => void;
};

const ThemeScheduleContext = createContext<ThemeScheduleValue | null>(null);

/** Owns the user's theme preference (light/dark/auto-by-schedule) and the schedule's two switch times — ThemeScheduler reads this and drives next-themes accordingly. */
export function ThemeScheduleProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [lightTime, setLightTime] = useState(DEFAULT_LIGHT_TIME);
  const [darkTime, setDarkTime] = useState(DEFAULT_DARK_TIME);

  useEffect(() => {
    const savedMode = window.localStorage.getItem(MODE_KEY) as ThemeMode | null;
    const savedLight = window.localStorage.getItem(LIGHT_TIME_KEY);
    const savedDark = window.localStorage.getItem(DARK_TIME_KEY);
    // Restores the viewer's saved preferences on load — genuinely triggered
    // by reading persisted state, not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedMode === "light" || savedMode === "dark" || savedMode === "auto") setModeState(savedMode);
    if (savedLight) setLightTime(savedLight);
    if (savedDark) setDarkTime(savedDark);
  }, []);

  function setMode(next: ThemeMode) {
    setModeState(next);
    window.localStorage.setItem(MODE_KEY, next);
  }

  function setSchedule(nextLightTime: string, nextDarkTime: string) {
    setLightTime(nextLightTime);
    setDarkTime(nextDarkTime);
    window.localStorage.setItem(LIGHT_TIME_KEY, nextLightTime);
    window.localStorage.setItem(DARK_TIME_KEY, nextDarkTime);
  }

  return (
    <ThemeScheduleContext.Provider value={{ mode, setMode, lightTime, darkTime, setSchedule }}>
      {children}
    </ThemeScheduleContext.Provider>
  );
}

export function useThemeSchedule(): ThemeScheduleValue {
  const ctx = useContext(ThemeScheduleContext);
  if (!ctx) throw new Error("useThemeSchedule must be used within ThemeScheduleProvider");
  return ctx;
}
