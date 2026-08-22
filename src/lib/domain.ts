export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "e-mall.uz";
export const APP_SUBDOMAIN = "app";
export const APP_DOMAIN = `${APP_SUBDOMAIN}.${ROOT_DOMAIN}`;

const RESERVED_SLUGS = new Set([
  "www",
  "app",
  "api",
  "admin",
  "mall",
  "dashboard",
  "static",
  "assets",
  "cdn",
  "mail",
  "ns1",
  "ns2",
]);

/** Extracts the store subdomain from a request Host header, or null for the root/apex domain. */
export function extractStoreSlug(host: string): string | null {
  const hostname = host.split(":")[0].toLowerCase();

  // local dev: "dokon.localhost" -> "dokon"
  if (hostname.endsWith(".localhost")) {
    const sub = hostname.replace(".localhost", "");
    return sub && !RESERVED_SLUGS.has(sub) ? sub : null;
  }

  const root = ROOT_DOMAIN.toLowerCase();
  if (hostname === root || hostname === `www.${root}`) return null;

  if (hostname.endsWith(`.${root}`)) {
    const sub = hostname.slice(0, -1 * (`.${root}`.length));
    return sub && !RESERVED_SLUGS.has(sub) ? sub : null;
  }

  // Vercel preview deployments (project.vercel.app) — treat as root domain.
  return null;
}

/** True for app.e-mall.uz (or app.localhost in dev) — the logged-in dashboard host. */
export function isAppHost(host: string): boolean {
  const hostname = host.split(":")[0].toLowerCase();
  if (hostname === `${APP_SUBDOMAIN}.localhost`) return true;
  return hostname === APP_DOMAIN.toLowerCase();
}

/** Absolute origin for app.e-mall.uz, matching the current environment (http://app.localhost:PORT in dev). */
export function appOrigin(host: string): string {
  const [hostname, port] = host.split(":");
  if (hostname.toLowerCase().endsWith(".localhost") || hostname.toLowerCase() === "localhost") {
    return `http://${APP_SUBDOMAIN}.localhost${port ? `:${port}` : ""}`;
  }
  return `https://${APP_DOMAIN}`;
}

/** Absolute origin for the root marketing site (e-mall.uz), matching the current environment. */
export function rootOrigin(host: string): string {
  const [hostname, port] = host.split(":");
  if (hostname.toLowerCase().endsWith(".localhost") || hostname.toLowerCase() === "localhost") {
    return `http://localhost${port ? `:${port}` : ""}`;
  }
  return `https://${ROOT_DOMAIN}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
