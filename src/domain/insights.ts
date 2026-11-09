import type { Intercept, Testimony } from "./types";
import { localDateKey } from "./time";

export interface TestimonyStats {
  total: number;
  regret: number;
  glad: number;
}

function sameYear(iso: string, now: Date): boolean {
  return new Date(iso).getFullYear() === now.getFullYear();
}

export function interceptsForReason(
  intercepts: Intercept[],
  reasonKey: string,
  now = new Date(),
): Intercept[] {
  return intercepts.filter(
    (item) =>
      item.reason_key === reasonKey && sameYear(item.shown_at, now),
  );
}

export function reasonOccurrence(
  intercepts: Intercept[],
  reasonKey: string,
  currentId: string,
  now = new Date(),
): number {
  const list = interceptsForReason(intercepts, reasonKey, now)
    .slice()
    .sort((a, b) => a.shown_at.localeCompare(b.shown_at));
  const index = list.findIndex((item) => item.id === currentId);
  return index === -1 ? list.length : index + 1;
}

export function testimonyStats(
  intercepts: Intercept[],
  testimonies: Testimony[],
  reasonKey: string,
  now = new Date(),
): TestimonyStats {
  const ids = new Set(
    interceptsForReason(intercepts, reasonKey, now).map((item) => item.id),
  );
  let regret = 0;
  let glad = 0;
  for (const testimony of testimonies) {
    if (!ids.has(testimony.intercept_id)) continue;
    if (testimony.answer === "regret") regret += 1;
    if (testimony.answer === "glad") glad += 1;
  }
  return { total: ids.size, regret, glad };
}

export function shouldShowTestimony(input: {
  intercepts: Intercept[];
  testimonies: Testimony[];
  interceptId: string;
  reasonKey: string | null;
  enabled: boolean;
  now?: Date;
}): boolean {
  const {
    intercepts,
    testimonies,
    interceptId,
    reasonKey,
    enabled,
    now = new Date(),
  } = input;
  if (!enabled || !reasonKey) return false;
  const occurrence = reasonOccurrence(intercepts, reasonKey, interceptId, now);
  if (![3, 5, 8].includes(occurrence)) return false;
  const stats = testimonyStats(intercepts, testimonies, reasonKey, now);
  return stats.total >= 3;
}

export function nightCandidates(
  intercepts: Intercept[],
  testimonies: Testimony[],
  now = new Date(),
): Intercept[] {
  const today = localDateKey(now);
  const answered = new Set(testimonies.map((item) => item.intercept_id));
  return intercepts
    .filter(
      (item) =>
        localDateKey(new Date(item.shown_at)) === today &&
        item.action_taken === false &&
        (item.branch === "A" || item.branch === "D") &&
        !answered.has(item.id),
    )
    .sort((a, b) => a.shown_at.localeCompare(b.shown_at));
}
