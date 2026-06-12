import type { GlucoseTone, TargetRange } from "./types";

export const DEFAULT_TARGET: TargetRange = { low: 70, high: 180 };

export const fmtTime = (iso: string): string =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const fmtDay = (isoDay: string): string =>
  new Date(`${isoDay}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

export function glucoseTone(value: number, target: TargetRange = DEFAULT_TARGET): GlucoseTone {
  if (value < target.low) return "low";
  if (value > target.high) return "high";
  return "ok";
}

/** Current local time as a datetime-local input value: "YYYY-MM-DDTHH:mm". */
export function localDatetimeValue(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/** A datetime-local value is complete and parseable. */
export function isValidLocalDatetime(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value) &&
    !Number.isNaN(new Date(value).getTime())
  );
}
