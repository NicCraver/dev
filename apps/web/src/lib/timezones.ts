export const DEFAULT_TIMEZONE = "Asia/Shanghai";

const POPULAR_TIMEZONES = [
  "Asia/Shanghai",
  "Asia/Hong_Kong",
  "Asia/Taipei",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Asia/Dubai",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Australia/Sydney",
  "Pacific/Auckland",
  "UTC",
] as const;

const FALLBACK_TIMEZONES = [
  ...POPULAR_TIMEZONES,
  "Asia/Bangkok",
  "Asia/Kolkata",
  "Europe/Moscow",
  "America/Denver",
  "America/Sao_Paulo",
];

const offsetCache = new Map<string, string>();

export function getSupportedTimezones(): string[] {
  if (typeof Intl !== "undefined" && "supportedValuesOf" in Intl) {
    return [...Intl.supportedValuesOf("timeZone")].sort();
  }
  return [...FALLBACK_TIMEZONES];
}

export function getTimezoneOffsetLabel(timeZone: string, atMs = Date.now()): string {
  const cached = offsetCache.get(timeZone);
  if (cached) return cached;

  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date(atMs));
    const label = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    offsetCache.set(timeZone, label);
    return label;
  } catch {
    return "";
  }
}

export function formatTimezoneOption(timeZone: string, atMs = Date.now()): string {
  const offset = getTimezoneOffsetLabel(timeZone, atMs);
  return offset ? `${timeZone} (${offset})` : timeZone;
}

function normalizeQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

function matchesOffsetQuery(timeZone: string, query: string): boolean {
  const offset = getTimezoneOffsetLabel(timeZone).toLowerCase();
  if (!offset) return false;
  const q = query.replace(/\s/g, "");
  if (offset.includes(q)) return true;
  // 支持搜 +8、8、gmt+8
  const num = q.replace(/^gmt/, "").replace(/^utc/, "");
  if (/^[+-]?\d{1,2}$/.test(num)) {
    const n = Number(num);
    return offset.includes(`+${n}`) || offset.includes(`-${n}`) || offset.includes(`+0${n}`);
  }
  return false;
}

export function searchTimezones(zones: string[], query: string, limit = 80): string[] {
  const q = normalizeQuery(query);

  if (!q) {
    const popular = new Set<string>(POPULAR_TIMEZONES);
    const rest = zones.filter((z) => !popular.has(z));
    return [...new Set([DEFAULT_TIMEZONE, ...POPULAR_TIMEZONES, ...rest])].slice(0, 40);
  }

  const scored: { zone: string; score: number }[] = [];

  for (const zone of zones) {
    const lower = zone.toLowerCase();
    const city = lower.split("/").pop() ?? lower;

    if (lower === q || city === q) {
      scored.push({ zone, score: 100 });
      continue;
    }
    if (lower.startsWith(q) || city.startsWith(q)) {
      scored.push({ zone, score: 80 });
      continue;
    }
    if (lower.includes(q) || city.includes(q)) {
      scored.push({ zone, score: 60 });
      continue;
    }
    if (matchesOffsetQuery(zone, q)) {
      scored.push({ zone, score: 50 });
      continue;
    }
  }

  scored.sort((a, b) => b.score - a.score || a.zone.localeCompare(b.zone));
  const result = scored.map((s) => s.zone);

  if (!result.includes(DEFAULT_TIMEZONE) && DEFAULT_TIMEZONE.toLowerCase().includes(q)) {
    result.unshift(DEFAULT_TIMEZONE);
  }

  return result.slice(0, limit);
}
