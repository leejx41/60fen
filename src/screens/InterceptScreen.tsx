import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { BRANCH_LABEL, COPY } from "@/copy/strings";
import { formatHourMinuteIso } from "@/domain/time";
import { navigate } from "@/hooks/useHashRoute";
import { Icon } from "@/components/Icon";
import styles from "./InterceptScreen.module.css";

const OPTIONS: Array<{ branch: "A" | "B" | "C" | "D"; icon: string }> = [
  { branch: "A", icon: "psychology_alt" },
  { branch: "B", icon: "calendar_clock" },
  { branch: "C", icon: "bed" },
  { branch: "D", icon: "sentiment_neutral" },
];

interface InterceptScreenProps {
  interceptId: string;
}

export function InterceptScreen({ interceptId }: InterceptScreenProps): JSX.Element {
  const intercepts = useAppStore((state) => state.intercepts);
  const plans = useAppStore((state) => state.plans);
  const chooseBranch = useAppStore((state) => state.chooseBranch);
  const submitReason = useAppStore((state) => state.submitReason);
  const markWent = useAppStore((state) => state.markWent);
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);
  const [reason, setReason] = useState("");
  const [showFirstHint] = useState(!settings.first_intercept_seen);

  const intercept = intercepts.find((item) => item.id === interceptId);
  const plan = useMemo(
    () => plans.find((item) => item.id === intercept?.plan_id),
    [plans, intercept?.plan_id],
  );

  useEffect(() => {
    if (!intercept || !plan) navigate({ name: "today" });
  }, [intercept, plan]);

  useEffect(() => {
    if (showFirstHint) void updateSettings({ first_intercept_seen: true });
  }, [showFirstHint, updateSettings]);

  if (!intercept || !plan) return <div />;

  const time = plan.scheduled_at ? formatHourMinuteIso(plan.scheduled_at) : "";
  const trimmed = reason.trim();

  const goThere = async (): Promise<void> => {
    await markWent(intercept.id);
    navigate({ name: "acted", id: intercept.id });
  };

  const pick = async (branch: "A" | "B" | "C" | "D"): Promise<void> => {
    await chooseBranch(intercept.id, branch);
    navigate({ name: "branch", id: intercept.id, branch });
  };

  const sendReason = async (): Promise<void> => {
    if (!trimmed) return;
    await submitReason(intercept.id, trimmed);
    navigate({ name: "branch", id: intercept.id, branch: "A" });
  };

  return (
    <div className={styles.screen}>
      <div className={styles.glow} aria-hidden="true" />
      <main className={styles.main}>
        <div className={styles.meta}>
          <Icon name="directions_run" size={18} />
          <span>
            今天 {time} · {plan.title}
          </span>
        </div>

        <h1 className={styles.heading}>
          今天你大概会用
          <br />
          什么理由不去？
        </h1>
        {showFirstHint ? (
          <p className={styles.firstHint}>{COPY.interceptFirstHint}</p>
        ) : null}

        <section className={styles.block}>
          <div className={styles.labelRow}>
            <h2 className={styles.label}>{COPY.ownWords}</h2>
          </div>
          <div className={styles.inputCard}>
            <div className={styles.inputLine}>
              <Icon name="edit_note" size={20} className={styles.inputIcon} />
              <input
                className={styles.input}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder={COPY.reasonPlaceholder}
                aria-label={COPY.ownWords}
                autoComplete="off"
              />
              {reason ? (
                <button
                  type="button"
                  className={styles.clear}
                  onClick={() => setReason("")}
                  aria-label="清空"
                >
                  <Icon name="cancel" size={17} />
                </button>
              ) : null}
            </div>
            {trimmed ? (
              <button
                type="button"
                className={styles.continue}
                onClick={() => void sendReason()}
              >
                {COPY.submitReason}
                <Icon name="arrow_forward" size={16} />
              </button>
            ) : null}
          </div>
        </section>

        <section className={styles.block}>
          <div className={styles.labelRow}>
            <h2 className={styles.label}>{COPY.pickOne}</h2>
          </div>
          <ul className={styles.options}>
            {OPTIONS.map((option) => (
              <li key={option.branch}>
                <button
                  type="button"
                  className={styles.option}
                  onClick={() => void pick(option.branch)}
                >
                  <span className={styles.optionIcon}>
                    <Icon name={option.icon} size={20} />
                  </span>
                  <span className={styles.optionText}>{BRANCH_LABEL[option.branch]}</span>
                  <span className={styles.optionArrow}>
                    <Icon name="north_east" size={16} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <div className={styles.ctaBar}>
        <button type="button" className={styles.cta} onClick={() => void goThere()}>
          <Icon name="bolt" size={19} filled />
          {COPY.goThere}
        </button>
      </div>
    </div>
  );
}
