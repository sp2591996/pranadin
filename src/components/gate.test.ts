import { describe, expect, it } from "vitest";
import { gateScript } from "./gate";

/** Runs the inline gate in a fake window and returns where it redirected (or null). */
function run(path: string, stored: string | null, throws = false): string | null {
  let to: string | null = null;
  const location = { pathname: path, replace: (u: string) => (to = u) };
  const localStorage = {
    getItem: () => {
      if (throws) throw new Error("blocked");
      return stored;
    },
  };
  new Function("location", "localStorage", gateScript())(location, localStorage);
  return to;
}

describe("onboarding gate (US-03, QA-04)", () => {
  it("is valid JavaScript and sends a new user to onboarding in their URL language", () => {
    expect(run("/hi/today/", null)).toBe("/hi/onboarding/");
    expect(run("/en/practice/breath/sama-vritti/", JSON.stringify({ onboarded: false }))).toBe("/en/onboarding/");
    expect(run("/mr/settings/", "not json")).toBeNull(); // parse error: never lock out
  });
  it("lets onboarded users through", () => {
    expect(run("/en/today/", JSON.stringify({ onboarded: true }))).toBeNull();
  });
  it("never gates onboarding or the trust pages it links to", () => {
    expect(run("/en/onboarding/", null)).toBeNull();
    expect(run("/hi/info/disclaimer/", null)).toBeNull();
  });
  it("does not lock anyone out when storage is blocked", () => {
    expect(run("/en/today/", null, true)).toBeNull();
  });
});
