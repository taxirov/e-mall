"use client";

import { useEffect } from "react";
import { isAppHost } from "@/lib/domain";

/** Registers the PWA service worker only for the dashboard/POS app (app.e-mall.uz) — not the marketing site or store storefronts, where an "install app" prompt would be out of place. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    if (!isAppHost(window.location.host)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
