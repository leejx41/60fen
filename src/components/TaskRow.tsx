import type { Plan } from "@/domain/types";
import { formatHourMinuteIso } from "@/domain/time";
import styles from "./TaskRow.module.css";

interface TaskRowProps {
  plan: Plan;
  canOpen: boolean;
  onOpen: () => void;
  onFullScore: () => void;
}

export function TaskRow({
  plan,
  canOpen,
  onOpen,
  onFullScore,
}: TaskRowProps): JSX.Element {
  const done = plan.status === "done";
  const time = plan.scheduled_at ? formatHourMinuteIso(plan.scheduled_at) : "--:--";

  return (
    <li className={styles.row} data-done={done || undefined}>
      <span className={styles.time}>{time}</span>
      <button
        type="button"
        className={styles.title}
        onClick={onOpen}
        disabled={!canOpen}
        aria-label={`${time} ${plan.title}`}
      >
        {plan.title}
      </button>
      <button
        type="button"
        className={styles.score}
        data-done={done || undefined}
        onClick={onFullScore}
        disabled={done}
        aria-label={done ? `${plan.title} 已满分` : `标记 ${plan.title} 满分`}
      >
        {done ? "100" : "满分"}
      </button>
    </li>
  );
}
