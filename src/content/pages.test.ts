import { describe, expect, it } from "vitest";
import { applyFeedbackLink } from "./pages";
import { loadTrustPage } from "./load";

describe("{{feedbackLink}} (QA-05, D-022)", () => {
  it("fills in the link when configured", () => {
    expect(applyFeedbackLink("Please [tell us]({{feedbackLink}}).", "mailto:x@example.org")).toBe("Please [tell us](mailto:x@example.org).");
  });
  it("removes the promising sentence, and a lead-in question, when no link is set", () => {
    expect(applyFeedbackLink("We make mistakes. If you spot one, please [tell us]({{feedbackLink}}). See corrections.", null)).toBe(
      "We make mistakes. See corrections.",
    );
    expect(applyFeedbackLink("Found a missing credit? Please [tell us]({{feedbackLink}}).", null)).toBe("");
  });
  it("points the shipped Corrections page at the feedback email", () => {
    const page = loadTrustPage("en", "corrections");
    expect(page?.markdown).not.toMatch(/feedbackLink/);
    expect(page?.markdown).toContain("mailto:sachin@gmail.com");
  });
});
