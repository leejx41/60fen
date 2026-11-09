import { describe, expect, it, vi } from "vitest";
import type { Plan } from "@/domain/types";
import {
  dueNotificationBody,
  dueNotificationKey,
  shouldNotifyDue,
  showDueNotification,
} from "./notify";

describe("due notification policy", () => {
  it("only fires when the tab is hidden, the user opted in, and permission is granted", () => {
    expect(
      shouldNotifyDue({ hidden: true, enabled: true, permission: "granted" }),
    ).toBe(true);
  });

  it("never fires in a visible tab", () => {
    expect(
      shouldNotifyDue({ hidden: false, enabled: true, permission: "granted" }),
    ).toBe(false);
  });

  it("respects the opt-out and the browser permission", () => {
    expect(
      shouldNotifyDue({ hidden: true, enabled: false, permission: "granted" }),
    ).toBe(false);
    expect(
      shouldNotifyDue({ hidden: true, enabled: true, permission: "denied" }),
    ).toBe(false);
    expect(
      shouldNotifyDue({ hidden: true, enabled: true, permission: "default" }),
    ).toBe(false);
    expect(
      shouldNotifyDue({ hidden: true, enabled: true, permission: "unsupported" }),
    ).toBe(false);
  });

  it("uses one key per plan per local day", () => {
    expect(dueNotificationKey("seed_today_arch", new Date(2026, 10, 9, 18))).toBe(
      "sixty:notified:2026-11-09:seed_today_arch",
    );
    expect(dueNotificationKey("seed_today_arch", new Date(2026, 10, 10, 18))).toBe(
      "sixty:notified:2026-11-10:seed_today_arch",
    );
  });

  it("keeps the reminder copy neutral and at 60 points", () => {
    expect(dueNotificationBody("晨间慢跑 2 公里")).toBe(
      "晨间慢跑 2 公里。60 分就算数。",
    );
  });

  it("still dedupes in memory when localStorage writes fail", async () => {
    const plan: Plan = {
      id: "test_storage_fallback",
      title: "写三行字",
      scheduled_at: "2026-11-09T18:00",
      downgrade_action: "先打开文档",
      status: "today",
      created_at: "2026-11-09T08:00:00.000Z",
    };
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: class {
        static permission: NotificationPermission = "granted";
        onclick: (() => void) | null = null;
        constructor() {}
        close() {}
      },
    });
    const setItem = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("storage unavailable");
      });

    await expect(showDueNotification(plan, new Date(2026, 10, 9, 18))).resolves.toBe(
      true,
    );
    await expect(showDueNotification(plan, new Date(2026, 10, 9, 18))).resolves.toBe(
      false,
    );
    setItem.mockRestore();
  });
});
