import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { COPY } from "@/copy/strings";
import type { TestimonyAnswer } from "@/domain/types";
import { navigate } from "@/hooks/useHashRoute";
import { Icon } from "@/components/Icon";
import styles from "./NightScreen.module.css";

interface NightScreenProps {
  interceptId: string;
}

const OPTIONS: Array<{ label: string; answer: TestimonyAnswer; icon: string }> = [
  { label: COPY.nightOptions[0], answer: "glad", icon: "self_improvement" },
  { label: COPY.nightOptions[1], answer: "regret", icon: "lightbulb" },
  { label: COPY.nightOptions[2], answer: "forgot", icon: "waves" },
];

export function NightScreen({ interceptId }: NightScreenProps): JSX.Element {
  const intercepts = useAppStore((state) => state.intercepts);
  const plans = useAppStore((state) => state.plans);
  const testimonies = useAppStore((state) => state.testimonies);
  const answerNight = useAppStore((state) => state.answerNight);

  const intercept = intercepts.find((item) => item.id === interceptId);
  const plan = plans.find((item) => item.id === intercept?.plan_id);
  const alreadyAnswered = testimonies.some(
    (item) => item.intercept_id === interceptId,
  );

  useEffect(() => {
    if (!intercept || alreadyAnswered) navigate({ name: "today" });
  }, [intercept, alreadyAnswered]);

  if (!intercept) return <div />;

  const answer = async (value: TestimonyAnswer): Promise<void> => {
    await answerNight(intercept.id, value);
    navigate({ name: "today" });
  };

  return (
    <div className={styles.screen}>
      <main className={styles.main}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.top}>
          <span className={styles.moon}>
            <Icon name="bedtime" size={18} />
          </span>
          <span>21:00</span>
        </div>

        {plan ? <p className={styles.task}>{plan.title}</p> : null}

        <h1 className={styles.heading}>
          早上那个决定，
          <br />
          现在你怎么看？
        </h1>

        <ul className={styles.options}>
          {OPTIONS.map((option) => (
            <li key={option.answer}>
              <button
                type="button"
                className={styles.option}
                onClick={() => void answer(option.answer)}
              >
                <span className={styles.optionIcon}>
                  <Icon name={option.icon} size={20} />
                </span>
                <span className={styles.optionText}>{option.label}</span>
                <span className={styles.optionMark}>
                  <Icon name="check" size={16} />
                </span>
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          className={styles.skip}
          onClick={() => navigate({ name: "today" })}
        >
          {COPY.nightSkip}
        </button>
      </main>
    </div>
  );
}
