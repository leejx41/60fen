const pad = (value: number): string => String(value).padStart(2, "0");

/** Local calendar key, never UTC: 2026-11-09. */
export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Local wall-clock ISO with an explicit offset: 2026-11-09T18:00:00+08:00. */
export function toLocalIso(date: Date): string {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  return `${localDateKey(date)}T${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}:${pad(date.getSeconds())}${sign}${pad(Math.floor(abs / 60))}:${pad(
    abs % 60,
  )}`;
}

export function parseLocalDate(dateKey: string, time = "00:00"): Date {
  const dateParts = dateKey.split("-");
  const timeParts = time.split(":");
  const year = Number(dateParts[0] ?? 0);
  const month = Number(dateParts[1] ?? 1);
  const day = Number(dateParts[2] ?? 1);
  const hour = Number(timeParts[0] ?? 0);
  const minute = Number(timeParts[1] ?? 0);
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

export function formatHourMinute(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatHourMinuteIso(iso: string): string {
  return formatHourMinute(new Date(iso));
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return localDateKey(a) === localDateKey(b);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** "今天 18:00" / "明天 07:00" / "11月12日 07:00" */
export function scheduleLabel(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const time = formatHourMinute(date);
  if (isSameLocalDay(date, now)) return `今天 ${time}`;
  if (isSameLocalDay(date, addDays(now, 1))) return `明天 ${time}`;
  return `${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
}

/** "11月9日 周日" */
export function dateLabel(date: Date): string {
  const weekday = new Intl.DateTimeFormat("zh-CN", {
    weekday: "short",
  }).format(date);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${weekday}`;
}

export function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function isToday(iso: string | null, now = new Date()): boolean {
  return iso !== null && localDateKey(new Date(iso)) === localDateKey(now);
}

export function nowIso(): string {
  return toLocalIso(new Date());
}

export function uid(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}
