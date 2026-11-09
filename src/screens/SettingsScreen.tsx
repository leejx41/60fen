import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { COPY, UI_LABELS } from "@/copy/strings";
import { navigate } from "@/hooks/useHashRoute";
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "@/lib/notify";
import { TopBar, IconButton } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { Toggle } from "@/components/Toggle";
import { Icon } from "@/components/Icon";
import styles from "./SettingsScreen.module.css";

export function SettingsScreen(): JSX.Element {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const resetDemo = useAppStore((state) => state.resetDemo);
  const openIntercept = useAppStore((state) => state.openIntercept);
  const advanceToNext = useAppStore((state) => state.advanceToNext);
  const plans = useAppStore((state) => state.plans);
  const [permission, setPermission] = useState<NotificationPermissionState>(
    getNotificationPermission,
  );

  useEffect(() => {
    const sync = (): void => setPermission(getNotificationPermission());
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  const reminderSupported = permission !== "unsupported";
  const reminderBlocked = permission === "denied";
  const reminderChecked = settings.notify_enabled && permission === "granted";
  const reminderHint = !reminderSupported
    ? COPY.settingsNotificationsUnsupported
    : reminderBlocked
      ? COPY.settingsNotificationsDenied
      : settings.notify_enabled
        ? COPY.settingsNotificationsOn
        : COPY.settingsNotificationsOff;

  const toggleReminder = async (next: boolean): Promise<void> => {
    if (!next) {
      await updateSettings({ notify_enabled: false });
      return;
    }
    if (permission === "unsupported" || permission === "denied") return;

    let result: "default" | "granted" = permission;
    if (result === "default") {
      const requested = await requestNotificationPermission();
      setPermission(requested);
      if (requested !== "granted") {
        await updateSettings({ notify_enabled: false });
        return;
      }
      result = "granted";
    }
    await updateSettings({ notify_enabled: result === "granted" });
  };

  const setCapacity = (delta: number): void => {
    const next = Math.min(6, Math.max(1, settings.ref_capacity + delta));
    void updateSettings({
      ref_capacity: next,
      capacity_skipped: false,
      capacity_asked: true,
    });
  };

  const preview = async (): Promise<void> => {
    const plan = plans.find((item) => item.status === "today");
    if (!plan) return;
    const id = await openIntercept(plan.id);
    if (id) navigate({ name: "intercept", id });
  };

  const fastForward = async (): Promise<void> => {
    const id = await advanceToNext();
    if (id) navigate({ name: "intercept", id });
    else if (import.meta.env.DEV) window.alert(COPY.settingsNoMorePlans);
  };

  return (
    <div className={styles.screen}>
      <TopBar
        left={
          <IconButton
            label={UI_LABELS.backToday}
            icon="arrow_back_ios_new"
            size={18}
            onClick={() => navigate({ name: "today" })}
          />
        }
        center={<span className={styles.title}>{COPY.settings}</span>}
        right={<span className={styles.spacer} />}
      />
      <main className={styles.main}>
        <section className={styles.group}>
          <div className={styles.row}>
            <div>
              <p className={styles.label}>{COPY.settingsCapacity}</p>
              <p className={styles.hint}>
                {settings.capacity_skipped
                  ? COPY.settingsCapacitySkippedHint
                  : COPY.settingsCapacityHint}
              </p>
            </div>
            <div className={styles.stepper}>
              <button
                type="button"
                onClick={() => setCapacity(-1)}
                aria-label={UI_LABELS.decreaseCapacity}
                disabled={settings.ref_capacity <= 1}
              >
                <span aria-hidden="true">−</span>
              </button>
              <span>{settings.ref_capacity}</span>
              <button
                type="button"
                onClick={() => setCapacity(1)}
                aria-label={UI_LABELS.increaseCapacity}
                disabled={settings.ref_capacity >= 6}
              >
                <Icon name="add" size={18} />
              </button>
            </div>
          </div>
        </section>

        <section className={styles.group}>
          <div className={styles.row}>
            <div>
              <p className={styles.label}>{COPY.settingsTestimony}</p>
              <p className={styles.hint}>{COPY.settingsTestimonyHint}</p>
            </div>
            <Toggle
              label={COPY.settingsTestimony}
              checked={settings.testimony_enabled}
              onChange={(next) => void updateSettings({ testimony_enabled: next })}
            />
          </div>
        </section>

        <section className={styles.group}>
          <div className={styles.row}>
            <div>
              <p className={styles.label}>{COPY.settingsNotifications}</p>
              <p className={styles.hint}>{reminderHint}</p>
            </div>
            <Toggle
              label={COPY.settingsNotifications}
              checked={reminderChecked}
              disabled={!reminderSupported || reminderBlocked}
              onChange={(next) => void toggleReminder(next)}
            />
          </div>
        </section>

        <section className={styles.group}>
          <button
            type="button"
            className={styles.navRow}
            onClick={() => navigate({ name: "onboarding", replay: true })}
          >
            <span className={styles.navText}>
              <span className={styles.label}>{COPY.settingsReplay}</span>
              <span className={styles.hint}>{COPY.settingsReplayHint}</span>
            </span>
            <Icon name="arrow_forward_ios" size={15} className={styles.navArrow} />
          </button>
        </section>

        <section className={styles.group}>
          <div className={styles.about}>
            <div className={styles.brandRow}>
              <span className={styles.brandDot} />
              <span className={styles.brand}>{COPY.appName}</span>
            </div>
            <p>{COPY.settingsAboutBody}</p>
            <p className={styles.version}>{COPY.settingsVersion(__BUILD_ID__)}</p>
          </div>
        </section>

        {import.meta.env.DEV ? (
          <section className={styles.group}>
            <p className={styles.groupTitle}>{UI_LABELS.devTools}</p>
            <div className={styles.debug}>
              <button type="button" className={styles.debugButton} onClick={() => void preview()}>
                {UI_LABELS.previewIntercept}
                <Icon name="bolt" size={17} />
              </button>
              <button
                type="button"
                className={styles.debugButton}
                onClick={() => void fastForward()}
              >
                {UI_LABELS.advanceClock}
                <Icon name="arrow_forward" size={17} />
              </button>
              <button
                type="button"
                className={styles.debugButton}
                data-danger
                onClick={() => {
                  if (window.confirm(COPY.settingsResetConfirm)) {
                    void resetDemo().then(() => navigate({ name: "today" }));
                  }
                }}
              >
                {UI_LABELS.resetDemo}
                <Icon name="lock_reset" size={17} />
              </button>
            </div>
          </section>
        ) : null}
      </main>
      <BottomNav active="settings" />
    </div>
  );
}
