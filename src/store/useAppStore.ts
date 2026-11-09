import { create } from "zustand";
import type {
  Branch,
  Intercept,
  Plan,
  Settings,
  Testimony,
  TestimonyAnswer,
} from "@/domain/types";
import { localDateKey, toLocalIso, uid } from "@/domain/time";
import {
  createPoolPlan,
  createTodayPlan,
  markFullScore,
  movePlanToToday,
  passForToday,
  releaseToPool,
} from "@/domain/plans";
import { activeTodayRows } from "@/domain/capacity";
import { normalizeReason, reasonKeyForTag } from "@/domain/normalize";
import {
  putIntercept,
  putPlan,
  putTestimony,
  putSettings,
  readAll,
} from "@/data/db";
import {
  DEFAULT_SETTINGS,
  mergeSettings,
  resetToSample,
  seedIfNeeded,
  settingsRecord,
} from "@/data/seed";

interface AppState {
  ready: boolean;
  plans: Plan[];
  intercepts: Intercept[];
  testimonies: Testimony[];
  settings: Settings;
  clock: number;
  lastFullScore: string | null;

  init: () => Promise<void>;
  tick: (at?: number) => void;
  refresh: () => Promise<void>;

  addToday: (input: {
    title: string;
    time: string;
    downgradeAction?: string;
  }) => Promise<Plan>;
  addPool: (title: string) => Promise<Plan>;
  moveToToday: (planId: string, time: string) => Promise<void>;
  markFull: (planId: string) => Promise<void>;
  clearFullScoreFeedback: () => void;

  openIntercept: (planId: string) => Promise<string | null>;
  chooseBranch: (
    interceptId: string,
    branch: Exclude<Branch, "went">,
  ) => Promise<void>;
  submitReason: (interceptId: string, text: string) => Promise<void>;
  markWent: (interceptId: string) => Promise<void>;
  markNotToday: (interceptId: string) => Promise<void>;
  answerNight: (
    interceptId: string,
    answer: TestimonyAnswer,
  ) => Promise<void>;

  dismissOverload: () => Promise<void>;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  resetDemo: () => Promise<void>;
  maybeTriggerDue: () => Promise<Plan | null>;
  advanceToNext: () => Promise<string | null>;
}

const initialSettings = { ...DEFAULT_SETTINGS };

function replacePlan(plans: Plan[], next: Plan): Plan[] {
  return plans.map((plan) => (plan.id === next.id ? next : plan));
}

export const useAppStore = create<AppState>((set, get) => ({
  ready: false,
  plans: [],
  intercepts: [],
  testimonies: [],
  settings: initialSettings,
  clock: Date.now(),
  lastFullScore: null,

  init: async () => {
    await seedIfNeeded(new Date(get().clock));
    const data = await readAll();
    set({
      ready: true,
      plans: data.plans,
      intercepts: data.intercepts,
      testimonies: data.testimonies,
      settings: mergeSettings(data.settings),
    });
  },

  tick: (at) => {
    set({ clock: at ?? Date.now() });
  },

  refresh: async () => {
    const data = await readAll();
    set({
      plans: data.plans,
      intercepts: data.intercepts,
      testimonies: data.testimonies,
      settings: mergeSettings(data.settings),
    });
  },

  addToday: async ({ title, time, downgradeAction }) => {
    const clock = new Date(get().clock);
    const dateKey = localDateKey(clock);
    const plan = createTodayPlan({
      title,
      dateKey,
      time,
      downgradeAction,
    });
    await putPlan(plan);
    set({ plans: [...get().plans, plan] });
    return plan;
  },

  addPool: async (title) => {
    const plan = createPoolPlan(title);
    await putPlan(plan);
    set({ plans: [...get().plans, plan] });
    return plan;
  },

  moveToToday: async (planId, time) => {
    const plan = get().plans.find((item) => item.id === planId);
    if (!plan) return;
    const dateKey = localDateKey(new Date(get().clock));
    const next = movePlanToToday(plan, dateKey, time);
    await putPlan(next);
    set({ plans: replacePlan(get().plans, next) });
  },

  markFull: async (planId) => {
    const plan = get().plans.find((item) => item.id === planId);
    if (!plan || plan.status !== "today") return;
    const next = markFullScore(plan);
    await putPlan(next);
    set({
      plans: replacePlan(get().plans, next),
      lastFullScore: plan.title,
    });
  },

  clearFullScoreFeedback: () => set({ lastFullScore: null }),

  openIntercept: async (planId) => {
    const plan = get().plans.find((item) => item.id === planId);
    if (!plan || plan.status !== "today") return null;
    const today = localDateKey(new Date(get().clock));
    const existing = get()
      .intercepts.filter(
        (item) =>
          item.plan_id === planId &&
          localDateKey(new Date(item.shown_at)) === today,
      )
      .sort((a, b) => b.shown_at.localeCompare(a.shown_at))[0];
    if (existing) return existing.id;

    const intercept: Intercept = {
      id: uid("intercept"),
      plan_id: planId,
      reason_text: null,
      reason_type: null,
      reason_key: null,
      branch: null,
      shown_at: toLocalIso(new Date(get().clock)),
      resolved_at: null,
      action_taken: null,
    };
    await putIntercept(intercept);
    set({ intercepts: [...get().intercepts, intercept] });
    return intercept.id;
  },

  chooseBranch: async (interceptId, branch) => {
    const intercept = get().intercepts.find((item) => item.id === interceptId);
    if (!intercept) return;
    const resolved: Intercept = {
      ...intercept,
      branch,
      reason_text: null,
      reason_type: "tag",
      reason_key: reasonKeyForTag(branch),
      action_taken: false,
      resolved_at: toLocalIso(new Date(get().clock)),
    };
    await putIntercept(resolved);
    set({ intercepts: get().intercepts.map((item) => (item.id === interceptId ? resolved : item)) });

    const plan = get().plans.find((item) => item.id === intercept.plan_id);
    if (!plan) return;
    let nextPlan: Plan | null = null;
    if (branch === "B") nextPlan = releaseToPool(plan);
    if (branch === "C") nextPlan = passForToday(plan);
    if (nextPlan) {
      await putPlan(nextPlan);
      set({ plans: replacePlan(get().plans, nextPlan) });
    }
  },

  submitReason: async (interceptId, text) => {
    const raw = text.trim();
    const key = normalizeReason(raw);
    if (!key) return;
    const intercept = get().intercepts.find((item) => item.id === interceptId);
    if (!intercept) return;
    const resolved: Intercept = {
      ...intercept,
      reason_text: raw,
      reason_type: "free",
      reason_key: key,
      branch: "A",
      action_taken: false,
      resolved_at: toLocalIso(new Date(get().clock)),
    };
    await putIntercept(resolved);
    set({
      intercepts: get().intercepts.map((item) =>
        item.id === interceptId ? resolved : item,
      ),
    });
  },

  markWent: async (interceptId) => {
    const intercept = get().intercepts.find((item) => item.id === interceptId);
    if (!intercept) return;
    const next: Intercept = {
      ...intercept,
      branch: intercept.branch ?? "went",
      action_taken: true,
      resolved_at: toLocalIso(new Date(get().clock)),
    };
    await putIntercept(next);
    set({
      intercepts: get().intercepts.map((item) =>
        item.id === interceptId ? next : item,
      ),
    });
    const plan = get().plans.find((item) => item.id === intercept.plan_id);
    if (plan) {
      const done = markFullScore(plan);
      await putPlan(done);
      set({ plans: replacePlan(get().plans, done) });
    }
  },

  markNotToday: async (interceptId) => {
    const intercept = get().intercepts.find((item) => item.id === interceptId);
    if (!intercept) return;
    const next: Intercept = {
      ...intercept,
      action_taken: false,
      resolved_at: toLocalIso(new Date(get().clock)),
    };
    await putIntercept(next);
    set({
      intercepts: get().intercepts.map((item) =>
        item.id === interceptId ? next : item,
      ),
    });
    const plan = get().plans.find((item) => item.id === intercept.plan_id);
    if (plan) {
      const deferred: Plan = { ...plan, status: "deferred" };
      await putPlan(deferred);
      set({ plans: replacePlan(get().plans, deferred) });
    }
  },

  answerNight: async (interceptId, answer) => {
    const testimony: Testimony = {
      id: uid("testimony"),
      intercept_id: interceptId,
      answer,
      created_at: toLocalIso(new Date(get().clock)),
    };
    await putTestimony(testimony);
    set({ testimonies: [...get().testimonies, testimony] });
  },

  dismissOverload: async () => {
    const settings = {
      ...get().settings,
      overload_dismissed_on: localDateKey(new Date(get().clock)),
    };
    await putSettings(settingsRecord(settings));
    set({ settings });
  },

  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    await putSettings(settingsRecord(settings));
    set({ settings });
  },

  resetDemo: async () => {
    await resetToSample(new Date(get().clock));
    const data = await readAll();
    set({
      plans: data.plans,
      intercepts: data.intercepts,
      testimonies: data.testimonies,
      settings: mergeSettings(data.settings),
      lastFullScore: null,
      ready: true,
    });
  },

  maybeTriggerDue: async () => {
    const { plans, intercepts, clock } = get();
    const now = new Date(clock);
    const today = localDateKey(now);
    return (
      activeTodayRows(plans, now).find((plan) => {
        if (!plan.scheduled_at) return false;
        if (new Date(plan.scheduled_at).getTime() > now.getTime()) return false;
        return !intercepts.some(
          (item) =>
            item.plan_id === plan.id &&
            localDateKey(new Date(item.shown_at)) === today,
        );
      }) ?? null
    );
  },

  advanceToNext: async () => {
    const now = new Date(get().clock);
    const next = activeTodayRows(get().plans, now).find(
      (plan) =>
        plan.scheduled_at !== null &&
        new Date(plan.scheduled_at).getTime() > now.getTime(),
    );
    if (!next || !next.scheduled_at) return null;
    const at = new Date(next.scheduled_at).getTime();
    set({ clock: at });
    return get().openIntercept(next.id);
  },
}));
