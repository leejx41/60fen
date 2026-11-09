import { describe, expect, it } from "vitest";
import type { Intercept, Plan, Testimony } from "@/domain/types";
import {
  countToday,
  recentCompletedMedian,
  shouldShowCapacityNotice,
  todayRows,
} from "@/domain/capacity";
import {
  nightCandidates,
  shouldShowTestimony,
  testimonyStats,
} from "@/domain/insights";
import { normalizeReason, reasonKeyForTag } from "@/domain/normalize";
import { COPY } from "@/copy/strings";
import { toLocalIso } from "@/domain/time";

const NOW = new Date(2026, 10, 9, 12, 0, 0);

function plan(id: string, time: string, status: Plan["status"] = "today"): Plan {
  const date = new Date(2026, 10, 9, Number(time.slice(0, 2)), Number(time.slice(3, 5)));
  return {
    id,
    title: id,
    scheduled_at: toLocalIso(date),
    downgrade_action: "先做五分钟",
    status,
    created_at: toLocalIso(new Date(2026, 10, 9, 6, 0, 0)),
  };
}

function intercept(
  id: string,
  overrides: Partial<Intercept> = {},
): Intercept {
  return {
    id,
    plan_id: "p1",
    reason_text: null,
    reason_type: "tag",
    reason_key: "tag:A",
    branch: "A",
    shown_at: toLocalIso(new Date(2026, 10, 9, 7, 0, 0)),
    resolved_at: null,
    action_taken: false,
    ...overrides,
  };
}

describe("branch 与 reasonKey 分离", () => {
  it("自由理由归一化后绝不等同于 tag:A", () => {
    const key = normalizeReason("  太 累 了。 ");
    expect(key).toBe("太累了");
    expect(key).not.toBe(reasonKeyForTag("A"));
  });

  it("只统一标点与空白，不做语义相似", () => {
    expect(normalizeReason("太累了。")).toBe(normalizeReason(" 太累了 "));
    expect(normalizeReason("太累了")).not.toBe(normalizeReason("有点累"));
  });

  it("标签理由使用 tag: 前缀", () => {
    expect(reasonKeyForTag("A")).toBe("tag:A");
    expect(reasonKeyForTag("D")).toBe("tag:D");
  });
});

describe("当晚一问候选", () => {
  it("只问今天、未行动、A/D 且未回答的拦截", () => {
    const list = [
      intercept("a", { branch: "A" }),
      intercept("b", { branch: "B" }),
      intercept("c", { branch: "C" }),
      intercept("d", { branch: "D" }),
      intercept("went", { branch: "went", action_taken: true }),
      intercept("answered", { branch: "A" }),
      intercept("other-day", {
        branch: "A",
        shown_at: toLocalIso(new Date(2026, 10, 8, 7, 0, 0)),
      }),
    ];
    const testimonies: Testimony[] = [
      {
        id: "t1",
        intercept_id: "answered",
        answer: "glad",
        created_at: toLocalIso(NOW),
      },
    ];
    const ids = nightCandidates(list, testimonies, NOW).map((item) => item.id);
    expect(ids).toEqual(["a", "d"]);
  });
});

describe("证词门槛", () => {
  const base = Array.from({ length: 7 }, (_, index) =>
    intercept(`i${index + 1}`, {
      shown_at: toLocalIso(new Date(2026, 10, 9, 7, index, 0)),
    }),
  );

  it("第 3 次、第 5 次、第 8 次才展示", () => {
    const enabled = {
      intercepts: base,
      testimonies: [] as Testimony[],
      reasonKey: "tag:A",
      enabled: true,
      now: NOW,
    };
    expect(
      shouldShowTestimony({ ...enabled, interceptId: "i2" }),
    ).toBe(false);
    expect(
      shouldShowTestimony({ ...enabled, interceptId: "i3" }),
    ).toBe(true);
    expect(
      shouldShowTestimony({ ...enabled, interceptId: "i4" }),
    ).toBe(false);
    expect(
      shouldShowTestimony({ ...enabled, interceptId: "i5" }),
    ).toBe(true);
    const eight = [...base, intercept("i8", { shown_at: toLocalIso(new Date(2026, 10, 9, 8, 0, 0)) })];
    expect(
      shouldShowTestimony({ ...enabled, intercepts: eight, interceptId: "i8" }),
    ).toBe(true);
  });

  it("glad 为 0 时不显示「另外 0 次」", () => {
    const text = COPY.testimonyTag("我怕今天做不好", 4, 3, 0);
    expect(text).not.toContain("另外");
    expect(text).toContain("其中 3 次");
  });

  it("统计只计算同一 reason_key 的证词", () => {
    const testimonies: Testimony[] = [
      { id: "t1", intercept_id: "i1", answer: "regret", created_at: toLocalIso(NOW) },
      { id: "t2", intercept_id: "i2", answer: "glad", created_at: toLocalIso(NOW) },
      { id: "t3", intercept_id: "other", answer: "regret", created_at: toLocalIso(NOW) },
    ];
    const stats = testimonyStats(base, testimonies, "tag:A", NOW);
    expect(stats).toEqual({ total: 7, regret: 1, glad: 1 });
  });
});

describe("今日池排序与容量", () => {
  it("按时间升序，满分项不挪位", () => {
    const rows = todayRows(
      [
        plan("late", "21:30"),
        plan("done", "07:00", "done"),
        plan("noon", "12:00"),
      ],
      NOW,
    );
    expect(rows.map((item) => item.id)).toEqual(["done", "noon", "late"]);
  });

  it("近 7 日完成中位数只统计有记录的天，少于 3 天返回 null", () => {
    const enough = todayRows([], NOW);
    const list = [
      plan("d1", "08:00", "done"),
      plan("d2", "09:00", "done"),
      { ...plan("d3", "10:00", "done"), scheduled_at: toLocalIso(new Date(2026, 10, 8, 10, 0, 0)) },
      { ...plan("d4", "10:00", "done"), scheduled_at: toLocalIso(new Date(2026, 10, 8, 11, 0, 0)) },
      { ...plan("d5", "10:00", "done"), scheduled_at: toLocalIso(new Date(2026, 10, 7, 10, 0, 0)) },
    ];
    expect(enough).toEqual([]);
    expect(recentCompletedMedian(list, NOW)).toBe(2);
    expect(recentCompletedMedian([plan("one", "08:00", "done")], NOW)).toBeNull();
  });

  it("超载提示每天最多一次且不阻断", () => {
    const list = [plan("a", "08:00"), plan("b", "09:00"), plan("c", "10:00")];
    expect(countToday(list, NOW)).toBe(3);
    expect(
      shouldShowCapacityNotice({
        plans: list,
        capacity: 2,
        dismissedOn: null,
        now: NOW,
      }),
    ).toBe(true);
    expect(
      shouldShowCapacityNotice({
        plans: list,
        capacity: 2,
        dismissedOn: "2026-11-09",
        now: NOW,
      }),
    ).toBe(false);
    expect(
      shouldShowCapacityNotice({
        plans: list,
        capacity: 3,
        dismissedOn: null,
        now: NOW,
      }),
    ).toBe(false);
  });
});
