import { describe, expect, it } from "vitest";
import { mergeSettings } from "@/data/seed";
import { parseHash, routeToHash } from "@/hooks/useHashRoute";

describe("onboarding settings migration", () => {
  it("keeps a brand-new install un-onboarded with both new flags off", () => {
    const settings = mergeSettings();
    expect(settings.onboarded).toBe(false);
    expect(settings.capacity_asked).toBe(false);
    expect(settings.first_intercept_seen).toBe(false);
  });

  it("does not interrupt an existing onboarded record with the new flows", () => {
    const settings = mergeSettings({
      id: "app",
      onboarded: true,
      ref_capacity: 3,
      capacity_skipped: false,
      testimony_enabled: true,
      overload_dismissed_on: null,
      demo_seeded: true,
    });
    expect(settings.onboarded).toBe(true);
    expect(settings.capacity_asked).toBe(true);
    expect(settings.first_intercept_seen).toBe(true);
  });

  it("preserves explicit false values from a current record", () => {
    const settings = mergeSettings({
      id: "app",
      onboarded: false,
      capacity_asked: false,
      first_intercept_seen: false,
    });
    expect(settings.capacity_asked).toBe(false);
    expect(settings.first_intercept_seen).toBe(false);
  });
});

describe("onboarding route", () => {
  it("parses first-run and replay modes", () => {
    expect(parseHash("#/onboarding")).toEqual({
      name: "onboarding",
      replay: false,
    });
    expect(parseHash("#/onboarding/replay")).toEqual({
      name: "onboarding",
      replay: true,
    });
  });

  it("serializes replay without losing the name", () => {
    expect(routeToHash({ name: "onboarding", replay: true })).toBe(
      "#/onboarding/replay",
    );
  });
});
