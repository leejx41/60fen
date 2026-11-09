import { useEffect } from "react";
import { Icon } from "./Icon";
import styles from "./Toast.module.css";

interface ToastProps {
  visible: boolean;
  title: string;
  body: string;
  onDone: () => void;
}

export function Toast({ visible, title, body, onDone }: ToastProps): JSX.Element | null {
  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(onDone, 2600);
    return () => window.clearTimeout(timer);
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <span className={styles.mark}>
        <Icon name="check" size={16} />
      </span>
      <span className={styles.text}>
        <strong>{title}</strong>
        <span>{body}</span>
      </span>
    </div>
  );
}
