import type { ReactNode } from "react";
import styles from "./TopBar.module.css";

interface TopBarProps {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  align?: "left" | "center";
}

export function TopBar({ left, center, right, align = "center" }: TopBarProps): JSX.Element {
  return (
    <header className={styles.bar} data-align={align}>
      <div className={styles.side}>{left}</div>
      <div className={styles.center}>{center}</div>
      <div className={styles.side} data-side="right">
        {right}
      </div>
    </header>
  );
}

interface IconButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
  size?: number;
}

export function IconButton({
  label,
  icon,
  onClick,
  size = 22,
}: IconButtonProps): JSX.Element {
  return (
    <button
      type="button"
      className={styles.iconButton}
      aria-label={label}
      onClick={onClick}
    >
      <span className="icon" style={{ fontSize: size }} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
