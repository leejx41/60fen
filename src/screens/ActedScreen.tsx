import { useEffect, useMemo } from "react";
import { useAppStore } from "@/store/useAppStore";
import { COPY } from "@/copy/strings";
import { navigate } from "@/hooks/useHashRoute";
import { Icon } from "@/components/Icon";
import styles from "./ActedScreen.module.css";

interface ActedScreenProps {
  interceptId: string;
}

export function ActedScreen({ interceptId }: ActedScreenProps): JSX.Element {
  const intercepts = useAppStore((state) => state.intercepts);
  const plans = useAppStore((state) => state.plans);
  const clock = useAppStore((state) => state.clock);
  const intercept = intercepts.find((item) => item.id === interceptId);
  const plan = plans.find((item) => item.id === intercept?.plan_id);

  useEffect(() => {
    if (!intercept) navigate({ name: "today" });
  }, [intercept]);

  const count = useMemo(() => {
    const year = new Date(clock).getFullYear();
    return intercepts.filter(
      (item) =>
        item.action_taken === true &&
        item.reason_text !== null &&
        new Date(item.shown_at).getFullYear() === year,
    ).length;
  }, [intercepts, clock]);

  if (!intercept) return <div />;

  const showCount = intercept.reason_text !== null;
  const reason = intercept.reason_text;
  const title = plan?.title ?? "";

  return (
    <div className={styles.screen}>
      <main className={styles.main}>
        <div className={styles.glow} aria-hidden="true" />
        <span className={styles.check}>
          <Icon name="check" size={34} />
        </span>
        <h1 className={styles.heading}>{COPY.acted}</h1>
        <p className={styles.task}>{title}</p>

        {reason ? (
          <section className={styles.reasonCard}>
            <p className={styles.reason}>{reason}</p>
          </section>
        ) : null}

        {showCount ? (
          <section className={styles.countCard}>
            <p className={styles.countText}>{COPY.actedCount(count)}</p>
          </section>
        ) : null}

        <div className={styles.bottom}>
          <button
            type="button"
            className={styles.primary}
            onClick={() => navigate({ name: "today" })}
          >
            {COPY.actedButton}
          </button>
        </div>
      </main>
    </div>
  );
}
