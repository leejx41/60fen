import { useEffect } from "react";
import { nightCandidates } from "@/domain/insights";
import { localDateKey } from "@/domain/time";
import { useAppStore } from "@/store/useAppStore";
import {
  getNotificationPermission,
  NOTIFICATION_CLICK_EVENT,
  NOTIFICATION_CLICK_MESSAGE,
  shouldNotifyDue,
  showDueNotification,
} from "@/lib/notify";
import { navigate, parseHash, type Route } from "./useHashRoute";

function isPlainScreen(route: Route): boolean {
  return route.name === "today" || route.name === "pool" || route.name === "settings";
}

/**
 * sessionStorage can throw in private mode or when storage is disabled. Keep a
 * per-page fallback so a failed write cannot make the night question repeat.
 */
let nightAskedThisSession: string | null = null;

function hasNightBeenAsked(key: string): boolean {
  if (nightAskedThisSession === key) return true;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function rememberNightAsked(key: string): void {
  nightAskedThisSession = key;
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // The in-memory marker still prevents a repeat this session.
  }
}

export function useScheduler(route: Route): void {
  const ready = useAppStore((state) => state.ready);
  const tick = useAppStore((state) => state.tick);
  const maybeTriggerDue = useAppStore((state) => state.maybeTriggerDue);
  const openIntercept = useAppStore((state) => state.openIntercept);
  const plain = isPlainScreen(route);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let running = false;

    const run = async (): Promise<void> => {
      if (running) return;
      running = true;
      try {
        tick();
        // Use the route the app is actually rendering, not only the URL hash:
        // the first-run onboarding may be shown before the hash is populated.
        // Creating an intercept here would write a record that is never shown,
        // and the next poll would skip that plan forever.
        if (cancelled || !plain) return;
        const due = await maybeTriggerDue();
        if (cancelled || !due) return;
        if (!isPlainScreen(parseHash(window.location.hash))) return;

        // Hidden tabs cannot show the intercept card. Leave the plan untouched
        // and send one best-effort reminder; opening the app will catch it up.
        if (document.visibilityState === "hidden") {
          const state = useAppStore.getState();
          if (
            shouldNotifyDue({
              hidden: true,
              enabled: state.settings.notify_enabled,
              permission: getNotificationPermission(),
            })
          ) {
            await showDueNotification(due, new Date(state.clock));
          }
          return;
        }

        const id = await openIntercept(due.id);
        if (!id) return;
        // Once the intercept exists it must be shown, otherwise the record
        // would suppress this plan for the rest of the day. Do not re-check
        // the route or a cancellation flag here: a navigation during the
        // IndexedDB write would otherwise leave an invisible intercept behind.
        navigate({ name: "intercept", id });
      } finally {
        running = false;
      }
    };

    const onNotificationClick = (): void => {
      void run();
    };
    const onWorkerMessage = (event: MessageEvent): void => {
      if (event.data?.type === NOTIFICATION_CLICK_MESSAGE) void run();
    };

    void run();
    const timer = window.setInterval(() => void run(), 15_000);
    const onVisible = (): void => {
      if (document.visibilityState === "visible") void run();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(NOTIFICATION_CLICK_EVENT, onNotificationClick);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", onWorkerMessage);
    }
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(NOTIFICATION_CLICK_EVENT, onNotificationClick);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener("message", onWorkerMessage);
      }
    };
  }, [ready, plain, tick, maybeTriggerDue, openIntercept]);

  useEffect(() => {
    if (!ready || route.name !== "today") return;
    const check = (): void => {
      // Do not open the night question invisibly. It is caught up the next
      // time the user actually looks at the app.
      if (document.visibilityState === "hidden") return;
      const now = new Date(useAppStore.getState().clock);
      if (now.getHours() < 21) return;
      const key = `night:${localDateKey(now)}`;
      if (hasNightBeenAsked(key)) return;
      const candidates = nightCandidates(
        useAppStore.getState().intercepts,
        useAppStore.getState().testimonies,
        now,
      );
      const first = candidates[0];
      if (!first) return;
      rememberNightAsked(key);
      navigate({ name: "night", id: first.id });
    };
    check();
    const timer = window.setInterval(check, 30_000);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [ready, route.name]);
}
