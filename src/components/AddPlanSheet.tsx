import { useEffect, useState } from "react";
import { Sheet } from "./Sheet";
import { COPY } from "@/copy/strings";
import { clampTitle, titleLength } from "@/domain/plans";
import { Icon } from "./Icon";
import styles from "./AddPlanSheet.module.css";

interface AddPlanPayload {
  title: string;
  time?: string;
  downgradeAction?: string;
}

interface AddPlanSheetProps {
  open: boolean;
  mode: "today" | "pool";
  onClose: () => void;
  onSubmit: (payload: AddPlanPayload) => Promise<void>;
}

export function AddPlanSheet({
  open,
  mode,
  onClose,
  onSubmit,
}: AddPlanSheetProps): JSX.Element {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [step, setStep] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setTime("");
    setStep("");
    setBusy(false);
  }, [open, mode]);

  const isToday = mode === "today";
  const canSubmit = title.trim().length > 0 && (!isToday || time.length > 0);

  const submit = async (): Promise<void> => {
    if (!canSubmit || busy) return;
    setBusy(true);
    try {
      await onSubmit({
        title: clampTitle(title),
        time: isToday ? time : undefined,
        downgradeAction: isToday ? step.trim() || undefined : undefined,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      title={isToday ? COPY.addTodayTitle : COPY.poolAddTitle}
      subtitle={isToday ? undefined : COPY.poolSubcopy}
      onClose={onClose}
      footer={
        <>
          <button type="button" className={styles.cancel} onClick={onClose}>
            {COPY.cancel}
          </button>
          <button
            type="button"
            className={styles.submit}
            onClick={() => void submit()}
            disabled={!canSubmit || busy}
          >
            {isToday ? COPY.saveToday : COPY.savePool}
            <Icon name="arrow_forward" size={18} />
          </button>
        </>
      }
    >
      <div className={styles.field}>
        <div className={styles.labelRow}>
          <label className={styles.label} htmlFor="plan-title">
            {COPY.titleLabel}
          </label>
          <span className={styles.meta}>
            {titleLength(title)}/20
          </span>
        </div>
        <input
          id="plan-title"
          className={styles.input}
          value={title}
          onChange={(event) => setTitle(clampTitle(event.target.value))}
          placeholder={COPY.titlePlaceholder}
          autoComplete="off"
          maxLength={20}
        />
      </div>

      {isToday ? (
        <>
          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="plan-time">
                {COPY.timeLabel}
              </label>
              <span className={styles.required}>必填</span>
            </div>
            <div className={styles.timeRow}>
              <Icon name="calendar_clock" size={20} />
              <input
                id="plan-time"
                className={styles.time}
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                aria-describedby="time-hint"
              />
            </div>
            <p className={styles.hint} id="time-hint">
              {COPY.timeHint}
            </p>
          </div>

          <div className={styles.field}>
            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="plan-step">
                {COPY.stepLabel}
              </label>
              <span className={styles.meta}>选填</span>
            </div>
            <input
              id="plan-step"
              className={styles.input}
              value={step}
              onChange={(event) => setStep(event.target.value)}
              placeholder={COPY.stepPlaceholder}
              autoComplete="off"
            />
            <p className={styles.helper}>{COPY.stepHelper}</p>
          </div>
        </>
      ) : null}
    </Sheet>
  );
}
