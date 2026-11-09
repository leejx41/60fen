import { Icon } from "./Icon";
import { navigate } from "@/hooks/useHashRoute";
import styles from "./BottomNav.module.css";

type Tab = "today" | "pool" | "settings";

interface BottomNavProps {
  active: Tab;
}

const ITEMS: Array<{ tab: Tab; icon: string; label: string }> = [
  { tab: "today", icon: "wb_sunny", label: "今日池" },
  { tab: "pool", icon: "inbox", label: "想做池" },
  { tab: "settings", icon: "balance", label: "设置" },
];

export function BottomNav({ active }: BottomNavProps): JSX.Element {
  return (
    <nav className={styles.nav} aria-label="主导航">
      {ITEMS.map((item) => {
        const selected = item.tab === active;
        return (
          <button
            key={item.tab}
            type="button"
            className={styles.tab}
            data-active={selected || undefined}
            aria-current={selected ? "page" : undefined}
            onClick={() => navigate({ name: item.tab })}
          >
            <span className={styles.iconWrap}>
              <Icon name={item.icon} size={21} filled={selected} />
            </span>
            <span className={styles.label}>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
