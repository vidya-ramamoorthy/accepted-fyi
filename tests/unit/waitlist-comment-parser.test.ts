import { describe, it, expect } from "vitest";
import { parseWaitlistComment } from "@/lib/parsers/waitlist-comment";

describe("parseWaitlistComment", () => {
  describe("acceptances", () => {
    it.each([
      ["Accepted off the waitlist at Brown!", "Brown", "accepted_off_waitlist"],
      ["Got in off WL at Cornell!", "Cornell", "accepted_off_waitlist"],
      ["Off the WL at Yale 🎉", "Yale", "accepted_off_waitlist"],
      ["Brown - accepted off WL", "Brown", "accepted_off_waitlist"],
      ["Penn: accepted from waitlist!!", "Penn", "accepted_off_waitlist"],
      ["I just got admitted off the waitlist at UMich", "UMich", "accepted_off_waitlist"],
    ])("classifies %p as %p / %s", (input, expectedSchool, expectedOutcome) => {
      const result = parseWaitlistComment(input);
      expect(result).not.toBeNull();
      expect(result!.outcome).toBe(expectedOutcome);
      expect(result!.schoolName.toLowerCase()).toContain(expectedSchool.toLowerCase());
    });
  });

  describe("rejections", () => {
    it.each([
      ["Rejected off the waitlist at Yale", "Yale", "rejected_off_waitlist"],
      ["Denied off WL at Stanford :(", "Stanford", "rejected_off_waitlist"],
      ["Cornell - rejected off WL today", "Cornell", "rejected_off_waitlist"],
      ["Got rejected from Brown waitlist", "Brown", "rejected_off_waitlist"],
    ])("classifies %p as %p / %s", (input, expectedSchool, expectedOutcome) => {
      const result = parseWaitlistComment(input);
      expect(result).not.toBeNull();
      expect(result!.outcome).toBe(expectedOutcome);
      expect(result!.schoolName.toLowerCase()).toContain(expectedSchool.toLowerCase());
    });
  });

  describe("withdrawals", () => {
    it.each([
      ["Withdrew from Cornell waitlist", "Cornell", "withdrew"],
      ["Pulled myself from Brown WL", "Brown", "withdrew"],
      ["Removed myself from Yale's WL", "Yale", "withdrew"],
    ])("classifies %p as %p / %s", (input, expectedSchool, expectedOutcome) => {
      const result = parseWaitlistComment(input);
      expect(result).not.toBeNull();
      expect(result!.outcome).toBe(expectedOutcome);
      expect(result!.schoolName.toLowerCase()).toContain(expectedSchool.toLowerCase());
    });
  });

  describe("ambiguous / non-movement comments", () => {
    it.each([
      "Still waiting on Cornell",
      "Anyone heard back from Yale yet?",
      "How long did it take Brown to respond?",
      "[deleted]",
      "[removed]",
      "",
      "  ",
      "Good luck everyone!",
    ])("returns null for %p", (input) => {
      expect(parseWaitlistComment(input)).toBeNull();
    });

    it("returns null when outcome is unclear", () => {
      expect(parseWaitlistComment("Cornell is a great school")).toBeNull();
    });

    it("returns null when no school is found", () => {
      expect(parseWaitlistComment("Just got accepted off the waitlist!")).toBeNull();
    });
  });

  describe("multi-school comments", () => {
    it("returns the first school+outcome pair (avoids ambiguity)", () => {
      const result = parseWaitlistComment(
        "Accepted off WL at Brown! Still waiting on Cornell.",
      );
      expect(result).not.toBeNull();
      expect(result!.schoolName.toLowerCase()).toContain("brown");
      expect(result!.outcome).toBe("accepted_off_waitlist");
    });
  });
});
