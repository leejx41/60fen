import { Fragment, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BRANCH_LABEL, COPY } from "@/copy/strings";
import {
  shouldShowTestimony,
  testimonyStats,
} from "@/domain/insights";
import { navigate } from "@/hooks/useHashRoute";
import { TopBar, IconButton } from "@/components/TopBar";
import { Icon } from "@/components/Icon";
import roomPhoto from "@/assets/photos/room.jpg";
import restPhoto from "@/assets/photos/rest.jpg";
import streetPhoto from "@/assets/photos/street.jpg";
import styles from "./BranchScreen.module.css";

interface BranchScreenProps {
  interceptId: string;
  branch: "A" | "B" | "C" | "D";
}

function highlightSixty(text: string): ReactNode[] {
  const parts = text.split("60 分");
  return parts.map((part, index) => (
    <Fragment key={index}>
      {part}
      {index < parts.length - 1 ? <em className={styles.sixty}>60 分</em> : null}
    </Fragment>
  ));
}

export function BranchScreen({ interceptId, branch }: BranchScreenProps): JSX.Element {
  const intercepts = useAppStore((state) => state.intercepts);
  const testimonies = useAppStore((state) => state.testimonies);
  const plans = useAppStore((state) => state.plans);
  const settings = useAppStore((state) => state.settings);
  const markNotToday = useAppStore((state) => state.markNotToday);
  const [firstTestimony] = useState(() => {
    try {
      return !window.localStorage.getItem("sixty:testimony-source-seen");
    } catch {
      return true;
    }
  });

  const intercept = intercepts.find((item) => item.id === interceptId);
  const plan = plans.find((item) => item.id === intercept?.plan_id);
  const reasonText = intercept?.reason_text ?? null;
  const reasonKey = intercept?.reason_key ?? null;

  const showTestimony =
    intercept !== null &&
    intercept !== undefined &&
    shouldShowTestimony({
      intercepts,
      testimonies,
      interceptId,
      reasonKey,
      enabled: settings.testimony_enabled,
    });

  useEffect(() => {
    if (showTestimony && firstTestimony) {
      try {
        window.localStorage.setItem("sixty:testimony-source-seen", "1");
      } catch {
        // Storage can be unavailable in private mode; the note is non-critical.
      }
    }
  }, [showTestimony, firstTestimony]);

  useEffect(() => {
    if (!intercept || !plan) navigate({ name: "today" });
  }, [intercept, plan]);

  if (!intercept || !plan) return <div />;

  const back = (): void => navigate({ name: "today" });

  const finish = (): void => navigate({ name: "today" });

  const notToday = async (): Promise<void> => {
    await markNotToday(intercept.id);
    navigate({ name: "today" });
  };

  if (branch === "B") {
    return (
      <div className={styles.screen}>
        <TopBar left={<IconButton label="返回" icon="arrow_back_ios_new" size={18} onClick={back} />} />
        <main className={styles.main}>
          <section className={styles.bStatement}>
            <span className={styles.bIcon}>
              <Icon name="archive" size={24} />
            </span>
            <p>{COPY.branchB}</p>
          </section>
          <figure className={styles.photoCard}>
            <img src={roomPhoto} alt="" />
          </figure>
          <div className={styles.bottom}>
            <button type="button" className={styles.primary} onClick={finish}>
              {COPY.branchBButton}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (branch === "C") {
    return (
      <div className={styles.screen}>
        <TopBar left={<IconButton label="返回" icon="arrow_back_ios_new" size={18} onClick={back} />} />
        <main className={styles.main}>
          <figure className={styles.photoCard}>
            <img src={restPhoto} alt="" />
          </figure>
          <h1 className={styles.cHeading}>
            今天就别去了。
            <br />
            这不是借口。
          </h1>
          <div className={styles.bottom}>
            <button type="button" className={styles.primary} onClick={finish}>
              <Icon name="spa" size={19} />
              {COPY.branchCButton}
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (branch === "D") {
    return (
      <div className={styles.screen}>
        <TopBar left={<IconButton label="返回" icon="arrow_back_ios_new" size={18} onClick={back} />} />
        <main className={styles.main}>
          <h1 className={styles.dHeading}>{COPY.branchD}</h1>
          <section className={styles.downgrade}>
            <span className={styles.downgradeIcon}>
              <Icon name="directions_walk" size={22} />
            </span>
            <div>
              <p className={styles.downgradeLabel}>{COPY.downgradePrefix}</p>
              <p className={styles.downgradeText}>{plan.downgrade_action}</p>
            </div>
          </section>
          <figure className={styles.photoCard}>
            <img src={streetPhoto} alt="" />
          </figure>
          <div className={styles.actions}>
            <button type="button" className={styles.primary} onClick={finish}>
              {COPY.doThis}
              <Icon name="arrow_forward" size={18} />
            </button>
            <button type="button" className={styles.textButton} onClick={() => void notToday()}>
              {COPY.notToday}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const stats = reasonKey
    ? testimonyStats(intercepts, testimonies, reasonKey)
    : { total: 0, regret: 0, glad: 0 };
  const testimonyText =
    intercept.reason_type === "free" && reasonText
      ? COPY.testimonyFree(reasonText, stats.total, stats.regret)
      : COPY.testimonyTag(
          BRANCH_LABEL.A,
          stats.total,
          stats.regret,
          stats.glad,
        );
  const [calibrationLead, calibrationRest] =
    COPY.calibration(plan.title).split("但今天");

  return (
    <div className={styles.screen}>
      <TopBar left={<IconButton label="返回" icon="arrow_back_ios_new" size={18} onClick={back} />} />
      <main className={styles.main}>
        {reasonText ? (
          <section className={styles.quoteCard}>
            <p className={styles.kicker}>你的原话</p>
            <p className={styles.quote}>“{reasonText}”</p>
          </section>
        ) : null}

        {showTestimony ? (
          <section className={styles.testimonyCard}>
            <span className={styles.testimonyIcon}>
              <Icon name="history_edu" size={20} />
            </span>
            <p>{testimonyText}</p>
            {firstTestimony ? (
              <p className={styles.source}>{COPY.testimonySource}</p>
            ) : null}
          </section>
        ) : null}

        <section className={styles.calibrationCard}>
          <p className={styles.calibration}>
            {highlightSixty(calibrationLead ?? "")}
          </p>
          <p className={styles.calibrationRest}>
            但今天{highlightSixty(calibrationRest ?? "")}
          </p>
        </section>

        <section className={styles.downgrade}>
          <span className={styles.downgradeIcon}>
            <Icon name="directions_walk" size={22} />
          </span>
          <div>
            <p className={styles.downgradeLabel}>{COPY.downgradePrefix}</p>
            <p className={styles.downgradeText}>{plan.downgrade_action}</p>
          </div>
        </section>

        <div className={styles.actions}>
          <button type="button" className={styles.primary} onClick={finish}>
            {COPY.doThis}
            <Icon name="arrow_forward" size={18} />
          </button>
          <button type="button" className={styles.textButton} onClick={() => void notToday()}>
            {COPY.notToday}
          </button>
        </div>
      </main>
    </div>
  );
}
