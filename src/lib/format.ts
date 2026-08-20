/**
 * Manual thousands-grouping instead of `Number.toLocaleString("uz-UZ")`.
 * Node's default (small-icu) build lacks uz-UZ data and silently falls back
 * to a different separator than the browser's full-ICU implementation,
 * which causes a server/client hydration mismatch on every price shown.
 */
export function formatSom(amount: number | string): string {
  const value = Math.round(Number(amount));
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function pad2(n: number) {
  return n.toString().padStart(2, "0");
}

/** DD.MM.YYYY HH:MM — same output on server and client, unlike Intl locale formatting. */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
