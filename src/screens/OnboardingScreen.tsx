import { useCallback, useEffect, useRef, useState } from "react";
import { COPY } from "@/copy/strings";
import penPhoto from "@/assets/onboarding/pen.jpg";
import "@/assets/fonts/onboarding-fonts.css";
import styles from "./OnboardingScreen.module.css";

type ChartPhase = "empty" | "one" | "five";

interface OnboardingScreenProps {
  onDone: (skipped: boolean) => void;
}

const TOTAL = 4;

export function OnboardingScreen({ onDone }: OnboardingScreenProps): JSX.Element {
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [buttonReady, setButtonReady] = useState(false);
  const [chartPhase, setChartPhase] = useState<ChartPhase>("empty");
  const [labelsReady, setLabelsReady] = useState(false);
  const leaveTimer = useRef<number | null>(null);

  useEffect(() => {
    setButtonReady(false);
    setLabelsReady(false);
    setChartPhase("empty");

    const timers: number[] = [];
    if (step === 2) {
      timers.push(window.setTimeout(() => setChartPhase("one"), 450));
      timers.push(window.setTimeout(() => setChartPhase("five"), 1650));
      timers.push(
        window.setTimeout(() => {
          setLabelsReady(true);
          setButtonReady(true);
        }, 2850),
      );
    } else {
      timers.push(window.setTimeout(() => setButtonReady(true), 400));
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [step]);

  useEffect(
    () => () => {
      if (leaveTimer.current !== null) window.clearTimeout(leaveTimer.current);
    },
    [],
  );

  const finish = useCallback(
    (skipped: boolean) => {
      onDone(skipped);
    },
    [onDone],
  );

  const next = useCallback(() => {
    if (!buttonReady || leaving) return;
    if (step === TOTAL - 1) {
      finish(false);
      return;
    }
    setLeaving(true);
    leaveTimer.current = window.setTimeout(() => {
      setStep((current) => current + 1);
      setLeaving(false);
    }, 200);
  }, [buttonReady, finish, leaving, step]);

  const choosePhase = (phase: ChartPhase): void => {
    if (!labelsReady) return;
    setChartPhase(phase);
  };

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <span className={styles.pageIndex}>{COPY.onboardingPage(step + 1)}</span>
        <button
          type="button"
          className={styles.skip}
          onClick={() => finish(true)}
        >
          {COPY.onboardingSkip}
        </button>
      </header>

      <main className={styles.main}>
        <div
          key={step}
          className={`${styles.page} ${leaving ? styles.leaving : ""}`}
        >
          {step === 0 ? (
            <section className={styles.introOne}>
              <span className={styles.needle} aria-hidden="true" />
              <h1 className={styles.statement} aria-label="每天都有很多事想做。但总有一些，一直停在“想做”。">
                {COPY.onboardingOne.map((line, index) => (
                  <span
                    key={line}
                    className={styles.statementLine}
                    style={{ animationDelay: `${index * 350}ms` }}
                  >
                    {line}
                    {index === COPY.onboardingOne.length - 1 ? (
                      <span className={styles.pulse} aria-hidden="true" />
                    ) : null}
                  </span>
                ))}
              </h1>
            </section>
          ) : null}

          {step === 1 ? (
            <section className={styles.introTwo}>
              <h1 className={styles.twoLead}>{COPY.onboardingTwoLead}</h1>
              <div className={styles.trapCard}>
                <p className={styles.waitLead}>{COPY.onboardingTwoWait}</p>
                <ul className={styles.waitList}>
                  {COPY.onboardingTwoWaits.map((line, index) => (
                    <li
                      key={line}
                      className={styles.waitItem}
                      style={{ animationDelay: `${400 + index * 220}ms` }}
                    >
                      <span
                        className={styles.waitRule}
                        style={{ width: `${18 + index * 12}px` }}
                        aria-hidden="true"
                      />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <span className={styles.ticks} aria-hidden="true">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </span>
              </div>
              <div className={styles.verdictCard}>
                <p className={styles.missed}>{COPY.onboardingTwoMissed}</p>
                <p className={styles.verdict}>{COPY.onboardingTwoVerdict}</p>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className={styles.introThree}>
              <h1 className={styles.threeQuestion}>
                {COPY.onboardingThreeQuestion}
              </h1>
              <p className={styles.threeStatement}>
                {COPY.onboardingThreeStatement}
              </p>

              <div className={styles.chartCard}>
                <div className={styles.chartBody}>
                  {chartPhase === "one" ? (
                    <div className={styles.wideBar}>
                      <span>100</span>
                    </div>
                  ) : (
                    <div className={styles.bars}>
                      {[0, 1, 2, 3, 4].map((index) => (
                        <div
                          key={index}
                          className={styles.slot}
                          data-on={chartPhase === "five" ? "true" : undefined}
                        >
                          {chartPhase === "five" ? <span>60</span> : null}
                        </div>
                      ))}
                    </div>
                  )}
                  <span className={styles.chartScale} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                </div>

                <div className={styles.legend}>
                  <button
                    type="button"
                    className={styles.legendItem}
                    data-active={chartPhase === "one" ? "true" : undefined}
                    disabled={!labelsReady}
                    onClick={() => choosePhase("one")}
                  >
                    {COPY.onboardingThreeOne}
                  </button>
                  <button
                    type="button"
                    className={styles.legendItem}
                    data-active={chartPhase === "five" ? "true" : undefined}
                    disabled={!labelsReady}
                    onClick={() => choosePhase("five")}
                  >
                    {COPY.onboardingThreeFive}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className={styles.introFour}>
              <h1 className={styles.fourTitle}>{COPY.onboardingFourTitle}</h1>
              <p className={styles.fourLines}>
                {COPY.onboardingFourLines.map((line, index) => (
                  <span
                    key={line}
                    style={{ animationDelay: `${350 + index * 350}ms` }}
                  >
                    {line}
                  </span>
                ))}
              </p>

              <div className={styles.gaugeCard}>
                <span className={styles.gaugeCheck} aria-hidden="true">
                  ✓
                </span>
                <div className={styles.gaugeTrack}>
                  <div className={styles.gaugeFill} />
                  <span className={styles.gaugeMark}>60</span>
                </div>
              </div>

              <figure className={styles.photo}>
                <img src={penPhoto} alt="一支钢笔停在摊开的笔记本上" />
              </figure>
            </section>
          ) : null}
        </div>

        <div className={styles.controls}>
          <div
            className={styles.progress}
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={TOTAL}
            aria-valuenow={step + 1}
          >
            {Array.from({ length: TOTAL }, (_, index) => (
              <span
                key={index}
                className={styles.progressSegment}
                data-on={index <= step ? "true" : undefined}
              />
            ))}
          </div>
          <div className={styles.ctaSlot}>
            <button
              type="button"
              className={styles.cta}
              data-visible={buttonReady ? "true" : undefined}
              disabled={!buttonReady}
              onClick={next}
            >
              {step === TOTAL - 1
                ? COPY.onboardingStart
                : COPY.onboardingNext}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
