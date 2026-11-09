import { Sheet } from "./Sheet";
import { COPY } from "@/copy/strings";
import styles from "./CapacityPrompt.module.css";

interface CapacityPromptProps {
  open: boolean;
  onChoose: (capacity: number) => Promise<void>;
  onSkip: () => Promise<void>;
}

export function CapacityPrompt({
  open,
  onChoose,
  onSkip,
}: CapacityPromptProps): JSX.Element {
  return (
    <Sheet
      open={open}
      title="参考容量"
      subtitle={COPY.capacityQuestion}
      onClose={() => void onSkip()}
    >
      <div className={styles.options}>
        {[1, 2, 3, 4, 5, 6].map((value) => (
          <button
            key={value}
            type="button"
            className={styles.option}
            onClick={() => void onChoose(value)}
          >
            {value}
            <span>件</span>
          </button>
        ))}
      </div>
      <p className={styles.note}>{COPY.capacityFinal}</p>
      <button type="button" className={styles.skip} onClick={() => void onSkip()}>
        {COPY.capacitySkip}
      </button>
    </Sheet>
  );
}
