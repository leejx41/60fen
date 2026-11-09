import { useMemo, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { dateLabel } from "@/domain/time";
import {
  countToday,
  resolveReferenceCapacity,
  shouldShowCapacityNotice,
  todayRows,
} from "@/domain/capacity";
import { COPY } from "@/copy/strings";
import { navigate } from "@/hooks/useHashRoute";
import { TopBar, IconButton } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { TaskRow } from "@/components/TaskRow";
import { AddPlanSheet } from "@/components/AddPlanSheet";
import { Icon } from "@/components/Icon";
import styles from "./TodayScreen.module.css";

export function TodayScreen(): JSX.Element {
  const plans = useAppStore((state) => state.plans);
  const settings = useAppStore((state) => state.settings);
  const clock = useAppStore((state) => state.clock);
  const addToday = useAppStore((state) => state.addToday);
  const markFull = useAppStore((state) => state.markFull);
  const openIntercept = useAppStore((state) => state.openIntercept);
  const dismissOverload = useAppStore((state) => state.dismissOverload);

  const [sheetOpen, setSheetOpen] = useState(false);
  const now = useMemo(() => new Date(clock), [clock]);
  const rows = todayRows(plans, now);
  const count = countToday(plans, now);
  const capacity = resolveReferenceCapacity(
    plans,
    settings.ref_capacity,
    settings.capacity_skipped,
    now,
  );
  const showNotice = shouldShowCapacityNotice({
    plans,
    capacity,
    dismissedOn: settings.overload_dismissed_on,
    now,
  });

  const openPlan = async (planId: string): Promise<void> => {
    const id = await openIntercept(planId);
    if (id) navigate({ name: "intercept", id });
  };

  return (
    <div className={styles.screen}>
      <TopBar
        align="left"
        left={
          <div className={styles.identity}>
            <span className={styles.dot} aria-hidden="true" />
            <div>
              <span className={styles.hello}>今天</span>
              <span className={styles.date}>{dateLabel(now)}</span>
            </div>
          </div>
        }
        right={
          <IconButton
            label="设置"
            icon="balance"
            onClick={() => navigate({ name: "settings" })}
          />
        }
      />
      <main className={styles.main}>
        <div className={styles.sectionHead}>
          <div>
            <h1 className={styles.heading}>{COPY.todayPool}</h1>
            <p className={styles.count}>{count} 件</p>
          </div>
        </div>

        {showNotice && capacity !== null ? (
          <div className={styles.notice} role="status">
            <p>{COPY.overload(count, capacity)}</p>
            <button
              type="button"
              className={styles.noticeClose}
              onClick={() => void dismissOverload()}
              aria-label="关闭提示"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ) : null}

        {rows.length > 0 ? (
          <ul className={styles.list}>
            {rows.map((plan) => (
              <TaskRow
                key={plan.id}
                plan={plan}
                canOpen={
                  plan.status === "today" &&
                  plan.scheduled_at !== null &&
                  new Date(plan.scheduled_at).getTime() <= now.getTime()
                }
                onOpen={() => void openPlan(plan.id)}
                onFullScore={() => void markFull(plan.id)}
              />
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          className={styles.add}
          onClick={() => setSheetOpen(true)}
        >
          <Icon name="add" size={20} />
          添加一件事
        </button>
      </main>

      <BottomNav active="today" />
      <AddPlanSheet
        open={sheetOpen}
        mode="today"
        onClose={() => setSheetOpen(false)}
        onSubmit={async (payload) => {
          await addToday({
            title: payload.title,
            time: payload.time ?? "",
            downgradeAction: payload.downgradeAction,
          });
        }}
      />
    </div>
  );
}
