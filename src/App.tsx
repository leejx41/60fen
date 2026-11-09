import { useCallback, useEffect, useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { navigate, useHashRoute } from "@/hooks/useHashRoute";
import { useScheduler } from "@/hooks/useScheduler";
import { COPY } from "@/copy/strings";
import { Toast } from "@/components/Toast";
import { CapacityPrompt } from "@/components/CapacityPrompt";
import { TodayScreen } from "@/screens/TodayScreen";
import { PoolScreen } from "@/screens/PoolScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { InterceptScreen } from "@/screens/InterceptScreen";
import { BranchScreen } from "@/screens/BranchScreen";
import { ActedScreen } from "@/screens/ActedScreen";
import { NightScreen } from "@/screens/NightScreen";
import { OnboardingScreen } from "@/screens/OnboardingScreen";
import styles from "./App.module.css";

export function App(): JSX.Element {
  const route = useHashRoute();
  const ready = useAppStore((state) => state.ready);
  const settings = useAppStore((state) => state.settings);
  const lastFullScore = useAppStore((state) => state.lastFullScore);
  const init = useAppStore((state) => state.init);
  const clearFullScoreFeedback = useAppStore(
    (state) => state.clearFullScoreFeedback,
  );
  const updateSettings = useAppStore((state) => state.updateSettings);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void init();
  }, [init]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);

  const isReplay = settings.onboarded && route.name === "onboarding";
  const showOnboarding = !settings.onboarded || route.name === "onboarding";
  const capacityOpen =
    settings.onboarded && !settings.capacity_asked && route.name === "today";

  // Capacity onboarding owns the first today-pool view; let it finish before
  // due-plan interception starts, otherwise the modal is hidden immediately.
  useScheduler(
    showOnboarding || capacityOpen
      ? { name: "onboarding", replay: false }
      : route,
  );

  const closeToast = useCallback(() => {
    clearFullScoreFeedback();
  }, [clearFullScoreFeedback]);

  const finishOnboarding = useCallback(
    async (skipped: boolean): Promise<void> => {
      if (isReplay) {
        navigate({ name: "settings" });
        return;
      }
      await updateSettings(
        skipped
          ? {
              onboarded: true,
              capacity_asked: true,
              capacity_skipped: true,
            }
          : { onboarded: true },
      );
      navigate({ name: "today" });
    },
    [isReplay, updateSettings],
  );

  if (!ready) {
    return (
      <div className={styles.loading} aria-busy="true">
        <span className={styles.loadingDot} />
        <span className={styles.loadingBrand}>{COPY.appName}</span>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingScreen
        onDone={(skipped) => void finishOnboarding(skipped)}
      />
    );
  }

  let screen: JSX.Element;
  switch (route.name) {
    case "pool":
      screen = <PoolScreen />;
      break;
    case "settings":
      screen = <SettingsScreen />;
      break;
    case "intercept":
      screen = <InterceptScreen interceptId={route.id} />;
      break;
    case "branch":
      screen = <BranchScreen interceptId={route.id} branch={route.branch} />;
      break;
    case "acted":
      screen = <ActedScreen interceptId={route.id} />;
      break;
    case "night":
      screen = <NightScreen interceptId={route.id} />;
      break;
    case "today":
    default:
      screen = <TodayScreen />;
      break;
  }

  return (
    <>
      {screen}
      <Toast
        visible={lastFullScore !== null}
        title={COPY.fullScoreFeedbackTitle}
        body={COPY.fullScoreFeedbackBody}
        onDone={closeToast}
      />
      <CapacityPrompt
        open={capacityOpen}
        onChoose={async (value) => {
          await updateSettings({
            ref_capacity: value,
            capacity_skipped: false,
            capacity_asked: true,
            onboarded: true,
          });
        }}
        onSkip={async () => {
          await updateSettings({
            capacity_skipped: true,
            capacity_asked: true,
            onboarded: true,
          });
        }}
      />
    </>
  );
}
