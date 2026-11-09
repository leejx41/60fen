import { useEffect, useState } from "react";
import { Sheet } from "./Sheet";
import { COPY } from "@/copy/strings";
import { Icon } from "./Icon";
import styles from "./MoveToTodaySheet.module.css";

interface MoveToTodaySheetProps {
  open: boolean;
  planTitle: string;
  onClose: () => void;
  onSubmit: (time: string) => Promise<void>;
}

export function MoveToTodaySheet({
  open,
  planTitle,
  onClose,
  onSubmit,
}: MoveToTodaySheetProps): JSX.Element {
  const [time, setTime] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTime("");
    setBusy(false);
  }, [open, planTitle]);

  const submit = async (): Promise<void> => {
    if (!time || busy) return;
    setBusy(true);
    try {
      await onSubmit(time);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet
      open={open}
      title={
        <>
          「{planTitle}」
          <br />
          什么时候做？
        </>
      }
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
            disabled={!time || busy}
          >
            放进今天
            <Icon name="arrow_forward" size={18} />
          </button>
        </>
      }
    >
      <div className={styles.timeRow}>
        <Icon name="calendar_clock" size={20} />
        <input
          className={styles.time}
          type="time"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          aria-label="什么时候做"
        />
      </div>
      <p className={styles.hint}>{COPY.timeHint}</p>
    </Sheet>
  );
}
