function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Which theme should be active right now given a light-start and dark-start
 * time (both "HH:MM", 24h). Handles the light window wrapping past midnight
 * (e.g. light starting at 22:00 and dark at 06:00 the next morning).
 */
export function resolveScheduledTheme(now: Date, lightTime: string, darkTime: string): "light" | "dark" {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const lightMinutes = toMinutes(lightTime);
  const darkMinutes = toMinutes(darkTime);

  if (lightMinutes === darkMinutes) return "light";

  if (lightMinutes < darkMinutes) {
    return nowMinutes >= lightMinutes && nowMinutes < darkMinutes ? "light" : "dark";
  }
  return nowMinutes >= lightMinutes || nowMinutes < darkMinutes ? "light" : "dark";
}

/** Ms until the next scheduled transition, so the scheduler can set one precise timer instead of polling every minute. */
export function msUntilNextTransition(now: Date, lightTime: string, darkTime: string): number {
  const boundaries = [toMinutes(lightTime), toMinutes(darkTime)].sort((a, b) => a - b);
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const next = boundaries.find((b) => b > nowMinutes);
  const nextMinutes = next ?? boundaries[0] + 24 * 60;
  return Math.max(1000, Math.round((nextMinutes - nowMinutes) * 60 * 1000));
}
