import type { Plan } from "./types";
import { localDateKey, parseLocalDate, toLocalIso, uid } from "./time";

export const TITLE_LIMIT = 20;
export const DEFAULT_DOWNGRADE_ACTION = "先做五分钟";

export function clampTitle(input: string): string {
  return Array.from(input.trim()).slice(0, TITLE_LIMIT).join("");
}

export function titleLength(input: string): number {
  return Array.from(input).length;
}

export interface NewTodayPlanInput {
  title: string;
  dateKey: string;
  time: string;
  downgradeAction?: string;
}

export function createTodayPlan(input: NewTodayPlanInput): Plan {
  const title = clampTitle(input.title);
  if (!title) throw new Error("TITLE_REQUIRED");
  if (!/^\d{2}:\d{2}$/.test(input.time)) throw new Error("TIME_REQUIRED");
  const scheduled = parseLocalDate(input.dateKey, input.time);
  if (Number.isNaN(scheduled.getTime())) throw new Error("TIME_INVALID");
  const step = input.downgradeAction?.trim();
  return {
    id: uid("plan"),
    title,
    scheduled_at: toLocalIso(scheduled),
    downgrade_action: step ? step : DEFAULT_DOWNGRADE_ACTION,
    status: "today",
    created_at: toLocalIso(new Date()),
  };
}

export function createPoolPlan(titleInput: string): Plan {
  const title = clampTitle(titleInput);
  if (!title) throw new Error("TITLE_REQUIRED");
  return {
    id: uid("plan"),
    title,
    scheduled_at: null,
    downgrade_action: null,
    status: "pool",
    created_at: toLocalIso(new Date()),
  };
}

export function movePlanToToday(
  plan: Plan,
  dateKey: string,
  time: string,
): Plan {
  if (!/^\d{2}:\d{2}$/.test(time)) throw new Error("TIME_REQUIRED");
  const scheduled = parseLocalDate(dateKey, time);
  return {
    ...plan,
    scheduled_at: toLocalIso(scheduled),
    status: "today",
  };
}

export function markFullScore(plan: Plan): Plan {
  if (plan.status !== "today") return plan;
  return { ...plan, status: "done" };
}

export function releaseToPool(plan: Plan): Plan {
  return { ...plan, status: "pool", scheduled_at: null, downgrade_action: null };
}

export function passForToday(plan: Plan): Plan {
  return { ...plan, status: "passed" };
}

export function isScheduledToday(plan: Plan, now = new Date()): boolean {
  return (
    plan.scheduled_at !== null &&
    localDateKey(new Date(plan.scheduled_at)) === localDateKey(now)
  );
}
