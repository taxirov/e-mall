// Minimal service worker — only enough to satisfy PWA installability and
// give a friendly fallback when fully offline. Deliberately does NOT cache
// dashboard/POS/API responses: this is a live commerce app (stock, sales,
// orders), so serving stale data offline would be worse than no data.
const SHELL_CACHE = "e-mall-shell-v2";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll([OFFLINE_URL, "/pwa-192.png"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(async () => {
      // Never let respondWith resolve to undefined (a cache miss here would
      // otherwise surface as the browser's native "page couldn't load"
      // error) — always hand back a real Response.
      const cached = await caches.match(OFFLINE_URL);
      return (
        cached ??
        new Response(
          "<!doctype html><meta charset=utf-8><meta name=viewport content=\"width=device-width,initial-scale=1\">" +
            "<body style=\"font-family:system-ui;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;text-align:center;padding:1.5rem\">" +
            "<div><h1 style=\"font-size:1.1rem\">Internet aloqasi yo'q</h1>" +
            "<p style=\"color:#666;font-size:0.9rem\">Iltimos, internetga ulanishni tekshiring va qayta urinib ko'ring.</p></div></body>",
          { status: 503, headers: { "content-type": "text/html; charset=utf-8" } }
        )
      );
    })
  );
});
