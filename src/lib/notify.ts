import type { Plan } from "@/domain/types";
import { localDateKey } from "@/domain/time";
import { COPY } from "@/copy/strings";

/** The browser permission, plus a value for browsers without the API. */
export type NotificationPermissionState =
  | NotificationPermission
  | "unsupported";

export const NOTIFICATION_CLICK_MESSAGE = "SIXTY_NOTIFICATION_CLICK";
export const NOTIFICATION_CLICK_EVENT = "sixty:check-due";

/**
 * localStorage is the cross-reload source of truth, but it can be unavailable
 * in private mode or when quota is exhausted. Keep a per-page fallback so the
 * 15s scheduler poll cannot spam the same reminder.
 */
const notifiedThisSession = new Set<string>();

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return window.Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (getNotificationPermission() === "unsupported") return "unsupported";
  try {
    return await window.Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/**
 * A notification is only useful for a plan that became due while the app is
 * hidden. While visible, the intercept card itself is the reminder.
 */
export function shouldNotifyDue(input: {
  hidden: boolean;
  enabled: boolean;
  permission: NotificationPermissionState;
}): boolean {
  return (
    input.hidden &&
    input.enabled &&
    input.permission === "granted"
  );
}

export function dueNotificationKey(planId: string, now: Date): string {
  return `sixty:notified:${localDateKey(now)}:${planId}`;
}

export function dueNotificationBody(title: string): string {
  return COPY.notificationBody(title);
}

function alreadyNotified(planId: string, now: Date): boolean {
  const key = dueNotificationKey(planId, now);
  if (notifiedThisSession.has(key)) return true;
  try {
    if (window.localStorage.getItem(key) === "1") {
      notifiedThisSession.add(key);
      return true;
    }
  } catch {
    // Fall through to the in-memory check only; storage is not required.
  }
  return false;
}

function rememberNotified(planId: string, now: Date): void {
  const key = dueNotificationKey(planId, now);
  notifiedThisSession.add(key);
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // The in-memory key still prevents a notification loop this session.
  }
}

/**
 * Best-effort system reminder. Returns true when a notification was handed to
 * the browser. The service worker path is preferred so that a click can wake
 * the open tab; the Notification constructor is a development fallback.
 */
export async function showDueNotification(plan: Plan, now: Date): Promise<boolean> {
  if (getNotificationPermission() !== "granted") return false;
  if (alreadyNotified(plan.id, now)) return false;

  const title = COPY.notificationTitle;
  const body = dueNotificationBody(plan.title);
  const tag = dueNotificationKey(plan.id, now);

  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.active) {
        await registration.showNotification(title, {
          body,
          tag,
          icon: "/icon-192.png",
          badge: "/icon-192.png",
          data: {
            planId: plan.id,
            url: "/#/today",
          },
        });
        rememberNotified(plan.id, now);
        return true;
      }
    }

    const notification = new window.Notification(title, {
      body,
      tag,
      icon: "/icon-192.png",
    });
    notification.onclick = () => {
      window.focus();
      window.location.hash = "#/today";
      window.dispatchEvent(new Event(NOTIFICATION_CLICK_EVENT));
      notification.close();
    };
    rememberNotified(plan.id, now);
    return true;
  } catch {
    return false;
  }
}
