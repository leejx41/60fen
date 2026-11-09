import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { poolRows } from "@/domain/capacity";
import { COPY } from "@/copy/strings";
import { navigate } from "@/hooks/useHashRoute";
import { TopBar, IconButton } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { AddPlanSheet } from "@/components/AddPlanSheet";
import { MoveToTodaySheet } from "@/components/MoveToTodaySheet";
import { Icon } from "@/components/Icon";
import styles from "./PoolScreen.module.css";

export function PoolScreen(): JSX.Element {
  const plans = useAppStore((state) => state.plans);
  const addPool = useAppStore((state) => state.addPool);
  const moveToToday = useAppStore((state) => state.moveToToday);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);

  const rows = poolRows(plans);
  const movingPlan = rows.find((plan) => plan.id === moving);

  return (
    <div className={styles.screen}>
      <TopBar
        left={
          <IconButton
            label="返回今日池"
            icon="arrow_back_ios_new"
            size={18}
            onClick={() => navigate({ name: "today" })}
          />
        }
        center={<span className={styles.title}>想做池</span>}
        right={
          <IconButton
            label="设置"
            icon="balance"
            onClick={() => navigate({ name: "settings" })}
          />
        }
      />
      <main className={styles.main}>
        <p className={styles.intro}>{COPY.poolSubcopy}</p>

        {rows.length === 0 ? (
          <p className={styles.empty}>{COPY.poolEmpty}</p>
        ) : (
          <ul className={styles.list}>
            {rows.map((plan) => (
              <li key={plan.id} className={styles.row}>
                <span className={styles.rowTitle}>{plan.title}</span>
                <button
                  type="button"
                  className={styles.move}
                  onClick={() => setMoving(plan.id)}
                >
                  {COPY.moveToToday}
                </button>
              </li>
            ))}
          </ul>
        )}

        <button
          type="button"
          className={styles.add}
          onClick={() => setSheetOpen(true)}
        >
          <Icon name="add" size={20} />
          添加
        </button>
      </main>

      <BottomNav active="pool" />
      <AddPlanSheet
        open={sheetOpen}
        mode="pool"
        onClose={() => setSheetOpen(false)}
        onSubmit={async (payload) => {
          await addPool(payload.title);
        }}
      />
      <MoveToTodaySheet
        open={moving !== null}
        planTitle={movingPlan?.title ?? ""}
        onClose={() => setMoving(null)}
        onSubmit={async (time) => {
          if (movingPlan) await moveToToday(movingPlan.id, time);
        }}
      />
    </div>
  );
}
