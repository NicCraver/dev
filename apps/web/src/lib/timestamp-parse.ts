export type ParseTimestampSuccess = {
  ok: true;
  ms: number;
  unit: "s" | "ms" | "iso";
};

export type ParseTimestampFailure = {
  ok: false;
  error: string;
};

export type ParseTimestampResult = ParseTimestampSuccess | ParseTimestampFailure;

export function parseTimestampInput(raw: string): ParseTimestampResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: "—" };
  }

  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    const n = Number(trimmed);
    if (!Number.isFinite(n)) {
      return { ok: false, error: "无效数字" };
    }
    const ms = n < 1e12 ? Math.round(n * 1000) : Math.round(n);
    return { ok: true, ms, unit: n < 1e12 ? "s" : "ms" };
  }

  const ms = Date.parse(trimmed);
  if (!Number.isNaN(ms)) {
    return { ok: true, ms, unit: "iso" };
  }

  return { ok: false, error: "无法解析" };
}

export function formatTimestampMs(ms: number, timeZone: string): string {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(ms));
}

export function formatUtcIso(ms: number): string {
  return new Date(ms).toISOString();
}

export function formatRelative(ms: number, nowMs = Date.now()): string {
  const diffSec = Math.round((ms - nowMs) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat("zh-CN", { numeric: "auto" });

  if (abs < 60) return rtf.format(diffSec, "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  return rtf.format(Math.round(diffSec / 86400), "day");
}
