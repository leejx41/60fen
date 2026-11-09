export type PlanStatus = "pool" | "today" | "done" | "deferred" | "passed";

export type Branch = "A" | "B" | "C" | "D" | "went";

export type ReasonType = "tag" | "free" | null;

export type TestimonyAnswer = "regret" | "glad" | "forgot";

export interface Plan {
  id: string;
  title: string;
  /** Local ISO string, e.g. 2026-11-09T18:00:00+08:00. Null only for pool plans. */
  scheduled_at: string | null;
  downgrade_action: string | null;
  status: PlanStatus;
  created_at: string;
}

export interface Intercept {
  id: string;
  plan_id: string;
  reason_text: string | null;
  reason_type: ReasonType;
  /** tag:A ... or the normalized free-text reason. Never tag:A for free text. */
  reason_key: string | null;
  branch: Branch | null;
  shown_at: string;
  resolved_at: string | null;
  action_taken: boolean | null;
}

export interface Testimony {
  id: string;
  intercept_id: string;
  answer: TestimonyAnswer;
  created_at: string;
}

export interface Settings {
  ref_capacity: number;
  capacity_skipped: boolean;
  testimony_enabled: boolean;
  /** Whether the four-screen introduction has been completed or skipped. */
  onboarded: boolean;
  /** Whether the reference-capacity question has been shown. */
  capacity_asked: boolean;
  /** Whether the one-time hint under the first intercept question was shown. */
  first_intercept_seen: boolean;
  /** Local date key (YYYY-MM-DD) on which the capacity notice was dismissed. */
  overload_dismissed_on: string | null;
  /** Whether the user asked for best-effort due reminders. */
  notify_enabled: boolean;
  /** Dev-seed marker; not part of the product model. */
  demo_seeded: boolean;
}
