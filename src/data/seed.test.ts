import { beforeEach, describe, expect, it } from "vitest";
import { clearAll, readAll } from "./db";
import { demoSeedEnabled, seedIfNeeded } from "./seed";

const NOON = new Date(2026, 10, 9, 12, 0, 0);

beforeEach(async () => {
  await clearAll();
});

describe("演示数据开关", () => {
  it("关闭时 seedIfNeeded 不写入任何记录", async () => {
    await seedIfNeeded(NOON, false);

    const data = await readAll();
    expect(data.settings).toBeUndefined();
    expect(data.plans).toHaveLength(0);
    expect(data.intercepts).toHaveLength(0);
    expect(data.testimonies).toHaveLength(0);
  });

  it("开启时才写入演示计划与已引导标记", async () => {
    await seedIfNeeded(NOON, true);

    const data = await readAll();
    expect(data.settings?.demo_seeded).toBe(true);
    expect(data.plans.length).toBeGreaterThan(0);
  });

  it("默认开关跟随 Vite 的 DEV 标志", () => {
    expect(demoSeedEnabled()).toBe(import.meta.env.DEV);
  });
});
