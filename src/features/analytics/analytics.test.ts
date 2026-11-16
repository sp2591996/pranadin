import { describe, expect, it } from "vitest";
import { buildPayload, canSend, platformOf } from "./events";

const common = { install_id: "abc", lang: "mr", app_version: "0.1.0", local_date: "2026-11-17", platform: "android" as const };

describe("analytics gate (FR-2.4, L5 6.3)", () => {
  it("sends nothing without a provider, outside production, or without a Yes", () => {
    expect(canSend({ provider: undefined, env: "production" }, "granted")).toBe(false);
    expect(canSend({ provider: "none", env: "production" }, "granted")).toBe(false);
    expect(canSend({ provider: "umami", env: "preview" }, "granted")).toBe(false);
    expect(canSend({ provider: "umami", env: "production" }, "unset")).toBe(false);
    expect(canSend({ provider: "umami", env: "production" }, "denied")).toBe(false);
    expect(canSend({ provider: "umami", env: "production" }, "granted")).toBe(true);
  });
});

describe("event payloads (PRD §10, L5 4.2)", () => {
  it("keeps only allow-listed properties", () => {
    const p = buildPayload(
      "practice_completed",
      // extra fields must be dropped even if a caller sneaks them in
      { type: "breath", planned_min: 3, actual_min: 3, entry: "plan", text: "zz-journal-probe" } as never,
      common,
    );
    expect(p).toEqual({ ...common, type: "breath", planned_min: 3, actual_min: 3, entry: "plan" });
    expect(JSON.stringify(p)).not.toContain("zz-journal-probe");
  });

  it("journal_saved carries no content, mood or length", () => {
    const p = buildPayload("journal_saved", { text: "secret", mood: "heavy", length: 6 } as never, common);
    expect(p).toEqual(common);
  });

  it("detects only a coarse platform", () => {
    expect(platformOf("Mozilla/5.0 (Linux; Android 13)")).toBe("android");
    expect(platformOf("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("ios");
    expect(platformOf("Mozilla/5.0 (Windows NT 10.0)")).toBe("desktop");
  });
});
