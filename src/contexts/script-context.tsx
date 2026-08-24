"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type UzbekScript = "latin" | "cyrillic";

const STORAGE_KEY = "e-mall-script";

type ScriptValue = { script: UzbekScript; toggleScript: () => void };

const ScriptContext = createContext<ScriptValue | null>(null);

/** App-wide Latin/Cyrillic toggle — the value itself only drives ScriptTransliterator's DOM pass, not per-string rendering, so this is safe to mount once at the root. */
export function ScriptProvider({ children }: { children: React.ReactNode }) {
  const [script, setScript] = useState<UzbekScript>("latin");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "cyrillic") {
      // Restores the viewer's last choice on load — genuinely triggered by
      // reading persisted state, not derived render state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScript("cyrillic");
    }
  }, []);

  function toggleScript() {
    setScript((prev) => {
      const next: UzbekScript = prev === "latin" ? "cyrillic" : "latin";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }

  return <ScriptContext.Provider value={{ script, toggleScript }}>{children}</ScriptContext.Provider>;
}

export function useScript(): ScriptValue {
  const ctx = useContext(ScriptContext);
  if (!ctx) throw new Error("useScript must be used within ScriptProvider");
  return ctx;
}
