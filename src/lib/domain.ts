export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "e-mall.uz";

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
