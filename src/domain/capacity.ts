import type { Plan } from "./types";
import { localDateKey, startOfLocalDay, addDays } from "./time";

/** Plans that belong in the today pool, including already-full-score rows. */
export function todayRows(plans: Plan[], now = new Date()): Plan[] {
  const key = localDateKey(now);
  return plans
    .filter(
      (plan) =>
        (plan.status === "today" || plan.status === "done") &&
        plan.scheduled_at !== null &&
        localDateKey(new Date(plan.scheduled_at)) === key,
    )
    .sort((a, b) => {
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      if (aTime !== bTime) return aTime - bTime;
      return a.created_at.localeCompare(b.created_at);
    });
}

export function poolRows(plans: Plan[]): Plan[] {
  return plans
    .filter((plan) => plan.status === "pool")
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function activeTodayRows(plans: Plan[], now = new Date()): Plan[] {
  return todayRows(plans, now).filter((plan) => plan.status === "today");
}

export function countToday(plans: Plan[], now = new Date()): number {
  return todayRows(plans, now).length;
}

export function completedCountOn(plans: Plan[], date: Date): number {
  const key = localDateKey(date);
  return plans.filter(
    (plan) =>
      plan.status === "done" &&
      plan.scheduled_at !== null &&
      localDateKey(new Date(plan.scheduled_at)) === key,
  ).length;
}

/**
 * Median of the last 7 calendar days' completed counts.
 * Only days that have any plan record count as data days.
 * Returns null when fewer than 3 such days exist.
 */
export function recentCompletedMedian(plans: Plan[], now = new Date()): number | null {
  const days = Array.from({ length: 7 }, (_, index) =>
    startOfLocalDay(addDays(now, index - 6)),
  );
  const counts: number[] = [];
  for (const day of days) {
    const key = localDateKey(day);
    const dayPlans = plans.filter(
      (plan) =>
        plan.scheduled_at !== null &&
        localDateKey(new Date(plan.scheduled_at)) === key,
    );
    if (dayPlans.length === 0) continue;
    counts.push(dayPlans.filter((plan) => plan.status === "done").length);
  }
  if (counts.length < 3) return null;
  const sorted = [...counts].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  const left = sorted[middle - 1] ?? 0;
  const right = sorted[middle] ?? 0;
  return Number(((left + right) / 2).toFixed(1));
}

export function resolveReferenceCapacity(
  plans: Plan[],
  settingsCapacity: number,
  settingsSkipped: boolean,
  now = new Date(),
): number | null {
  if (settingsSkipped) return null;
  const median = recentCompletedMedian(plans, now);
  return median ?? settingsCapacity;
}

export function shouldShowCapacityNotice(input: {
  plans: Plan[];
  capacity: number | null;
  dismissedOn: string | null;
  now: Date;
}): boolean {
  const { plans, capacity, dismissedOn, now } = input;
  if (capacity === null) return false;
  if (dismissedOn === localDateKey(now)) return false;
  return countToday(plans, now) > capacity;
}
