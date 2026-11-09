import { beforeEach, describe, expect, it } from "vitest";
import { useAppStore } from "@/store/useAppStore";

const NOON = new Date(2026, 10, 9, 12, 0, 0).getTime();

async function openPlan(planId: string): Promise<string> {
  const id = await useAppStore.getState().openIntercept(planId);
  if (!id) throw new Error("intercept not created");
  return id;
}

describe("store 拦截分支", () => {
  beforeEach(async () => {
    useAppStore.getState().tick(NOON);
    await useAppStore.getState().resetDemo();
  });

  it("自由理由：branch=A，reason_key 为归一化原话而非 tag:A", async () => {
    const id = await openPlan("seed_today_arch");
    await useAppStore.getState().submitReason(id, "  太 累 了。 ");
    const intercept = useAppStore
      .getState()
      .intercepts.find((item) => item.id === id);
    expect(intercept?.branch).toBe("A");
    expect(intercept?.reason_type).toBe("free");
    expect(intercept?.reason_key).toBe("太累了");
    expect(intercept?.reason_key).not.toBe("tag:A");
  });

  it("选 B：写 tag:B，计划静默回想做池", async () => {
    const id = await openPlan("seed_today_arch");
    await useAppStore.getState().chooseBranch(id, "B");
    const intercept = useAppStore
      .getState()
      .intercepts.find((item) => item.id === id);
    const plan = useAppStore
      .getState()
      .plans.find((item) => item.id === "seed_today_arch");
    expect(intercept?.reason_key).toBe("tag:B");
    expect(intercept?.action_taken).toBe(false);
    expect(plan?.status).toBe("pool");
  });

  it("我去了：action_taken=true，计划满分", async () => {
    const id = await openPlan("seed_today_arch");
    await useAppStore.getState().markWent(id);
    const intercept = useAppStore
      .getState()
      .intercepts.find((item) => item.id === id);
    const plan = useAppStore
      .getState()
      .plans.find((item) => item.id === "seed_today_arch");
    expect(intercept?.action_taken).toBe(true);
    expect(plan?.status).toBe("done");
  });

  it("今天不做了：计划标记 deferred，不再提醒", async () => {
    const id = await openPlan("seed_today_arch");
    await useAppStore.getState().markNotToday(id);
    const plan = useAppStore
      .getState()
      .plans.find((item) => item.id === "seed_today_arch");
    expect(plan?.status).toBe("deferred");
  });

  it("同一计划同一天复用拦截记录", async () => {
    const first = await openPlan("seed_today_arch");
    const second = await openPlan("seed_today_arch");
    expect(second).toBe(first);
  });

  it("到期扫描只返回候选，不提前写入拦截记录", async () => {
    useAppStore
      .getState()
      .tick(new Date(2026, 10, 9, 22, 0, 0).getTime());
    const before = useAppStore.getState().intercepts.length;
    const due = await useAppStore.getState().maybeTriggerDue();
    expect(due?.id).toBe("seed_today_arch");
    expect(useAppStore.getState().intercepts).toHaveLength(before);

    if (!due) throw new Error("expected a due plan");
    const id = await openPlan(due.id);
    expect(id).toBeTruthy();
    const next = await useAppStore.getState().maybeTriggerDue();
    expect(next?.id).toBe("seed_today_review");
  });
});
