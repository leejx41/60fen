import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  Intercept,
  Plan,
  PlanStatus,
  Settings,
  Testimony,
} from "@/domain/types";

export interface SettingsRecord extends Settings {
  id: "app";
}

interface SixtyDB extends DBSchema {
  plans: {
    key: string;
    value: Plan;
    indexes: { "by-status": PlanStatus; "by-scheduled": string };
  };
  intercepts: {
    key: string;
    value: Intercept;
    indexes: { "by-plan": string; "by-shown": string };
  };
  testimonies: {
    key: string;
    value: Testimony;
    indexes: { "by-intercept": string };
  };
  settings: {
    key: string;
    value: SettingsRecord;
  };
}

const DB_NAME = "sixty-point";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SixtyDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<SixtyDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SixtyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const plans = db.createObjectStore("plans", { keyPath: "id" });
        plans.createIndex("by-status", "status");
        plans.createIndex("by-scheduled", "scheduled_at");
        const intercepts = db.createObjectStore("intercepts", {
          keyPath: "id",
        });
        intercepts.createIndex("by-plan", "plan_id");
        intercepts.createIndex("by-shown", "shown_at");
        const testimonies = db.createObjectStore("testimonies", {
          keyPath: "id",
        });
        testimonies.createIndex("by-intercept", "intercept_id");
        db.createObjectStore("settings", { keyPath: "id" });
      },
    });
  }
  return dbPromise;
}

export async function readAll(): Promise<{
  plans: Plan[];
  intercepts: Intercept[];
  testimonies: Testimony[];
  settings: SettingsRecord | undefined;
}> {
  const db = await getDb();
  const [plans, intercepts, testimonies, settings] = await Promise.all([
    db.getAll("plans"),
    db.getAll("intercepts"),
    db.getAll("testimonies"),
    db.get("settings", "app"),
  ]);
  return { plans, intercepts, testimonies, settings };
}

export async function putPlan(plan: Plan): Promise<void> {
  const db = await getDb();
  await db.put("plans", plan);
}

export async function putPlans(plans: Plan[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("plans", "readwrite");
  await Promise.all([...plans.map((plan) => tx.store.put(plan)), tx.done]);
}

export async function putIntercept(intercept: Intercept): Promise<void> {
  const db = await getDb();
  await db.put("intercepts", intercept);
}

export async function putTestimony(testimony: Testimony): Promise<void> {
  const db = await getDb();
  await db.put("testimonies", testimony);
}

export async function putSettings(settings: SettingsRecord): Promise<void> {
  const db = await getDb();
  await db.put("settings", settings);
}

export async function clearAll(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(
    ["plans", "intercepts", "testimonies", "settings"],
    "readwrite",
  );
  await Promise.all([
    tx.objectStore("plans").clear(),
    tx.objectStore("intercepts").clear(),
    tx.objectStore("testimonies").clear(),
    tx.objectStore("settings").clear(),
    tx.done,
  ]);
}
