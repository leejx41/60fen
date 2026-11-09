import type { Plan, Settings } from "@/domain/types";
import { addDays, parseLocalDate, toLocalIso } from "@/domain/time";
import { clearAll, putPlan, putPlans, putSettings, readAll } from "./db";
import type { SettingsRecord } from "./db";

export const DEFAULT_SETTINGS: Settings = {
  ref_capacity: 3,
  capacity_skipped: false,
  testimony_enabled: true,
  onboarded: false,
  capacity_asked: false,
  first_intercept_seen: false,
  overload_dismissed_on: null,
  notify_enabled: false,
  demo_seeded: false,
};

/**
 * Fill fields added after the first local database version. Older records have
 * already been onboarded; do not surprise those users with the new flows.
 */
export function mergeSettings(
  record?: Partial<SettingsRecord>,
): Settings {
  const saved: Partial<Settings> = record ? { ...record } : {};
  delete (saved as { id?: string }).id;
  // Removed field from the first PWA draft; drop it from old records too.
  delete (saved as { notify_prompted?: boolean }).notify_prompted;
  const merged: Settings = { ...DEFAULT_SETTINGS, ...saved };
  if (record && record.onboarded === true && record.capacity_asked === undefined) {
    merged.capacity_asked = true;
  }
  if (
    record &&
    record.onboarded === true &&
    record.first_intercept_seen === undefined
  ) {
    merged.first_intercept_seen = true;
  }
  return merged;
}

export function settingsRecord(settings: Settings): SettingsRecord {
  return { id: "app", ...settings };
}

function pastDayPlan(
  now: Date,
  daysAgo: number,
  time: string,
  title: string,
): Plan {
  const day = addDays(now, -daysAgo);
  const scheduled = parseLocalDate(
    `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(
      day.getDate(),
    ).padStart(2, "0")}`,
    time,
  );
  const created = new Date(scheduled.getTime() - 60 * 60 * 1000);
  return {
    id: `seed_${daysAgo}_${time.replace(":", "")}`,
    title,
    scheduled_at: toLocalIso(scheduled),
    downgrade_action: "先做五分钟",
    status: "done",
    created_at: toLocalIso(created),
  };
}

export function samplePlans(now = new Date()): Plan[] {
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}-${String(now.getDate()).padStart(2, "0")}`;
  const at = (time: string): string => toLocalIso(parseLocalDate(today, time));
  const created = (hoursAgo: number): string =>
    toLocalIso(new Date(now.getTime() - hoursAgo * 60 * 60 * 1000));

  const todayPlans: Plan[] = [
    {
      id: "seed_today_run",
      title: "晨间慢跑 2 公里",
      scheduled_at: at("07:00"),
      downgrade_action: "穿上跑鞋，到楼下走五分钟",
      status: "done",
      created_at: created(8),
    },
    {
      id: "seed_today_arch",
      title: "撰写方案核心架构",
      scheduled_at: at("18:00"),
      downgrade_action: "先写下三个小标题",
      status: "today",
      created_at: created(4),
    },
    {
      id: "seed_today_review",
      title: "整理复盘文档草稿",
      scheduled_at: at("20:00"),
      downgrade_action: "先打开文档，写一行",
      status: "today",
      created_at: created(3),
    },
    {
      id: "seed_today_read",
      title: "阅读专业书 20 页",
      scheduled_at: at("21:30"),
      downgrade_action: "先读一页",
      status: "today",
      created_at: created(2),
    },
  ];

  const history: Plan[] = [
    pastDayPlan(now, 1, "08:00", "整理项目笔记"),
    pastDayPlan(now, 1, "12:30", "回复三封邮件"),
    pastDayPlan(now, 1, "19:00", "散步二十分钟"),
    pastDayPlan(now, 2, "07:30", "拉伸十分钟"),
    pastDayPlan(now, 2, "13:00", "推进一页方案"),
    pastDayPlan(now, 2, "21:00", "读五页书"),
    pastDayPlan(now, 3, "08:30", "写下今日三件事"),
    pastDayPlan(now, 3, "15:00", "整理桌面"),
    pastDayPlan(now, 3, "20:30", "早睡"),
  ];

  const pool: Plan = {
    id: "seed_pool_shelf",
    title: "整理书架最上面一层",
    scheduled_at: null,
    downgrade_action: null,
    status: "pool",
    created_at: created(20),
  };

  return [...history, ...todayPlans, pool];
}

/**
 * Demo records are a development aid, never product content. Production must
 * start from an empty database so the first screen only contains what the user
 * writes. Keep this guard before any database read or write.
 */
export function demoSeedEnabled(): boolean {
  return import.meta.env.DEV;
}

export async function seedIfNeeded(
  now = new Date(),
  allowDemo = demoSeedEnabled(),
): Promise<void> {
  if (!allowDemo) return;
  const { settings } = await readAll();
  if (settings) return;
  await putPlans(samplePlans(now));
  await putSettings(
    settingsRecord({ ...DEFAULT_SETTINGS, demo_seeded: true }),
  );
}

export async function resetToSample(now = new Date()): Promise<void> {
  await clearAll();
  await putPlans(samplePlans(now));
  await putSettings(settingsRecord({ ...DEFAULT_SETTINGS, demo_seeded: true }));
}

export async function saveSettings(settings: Settings): Promise<void> {
  await putSettings(settingsRecord(settings));
}

export { putPlan };
