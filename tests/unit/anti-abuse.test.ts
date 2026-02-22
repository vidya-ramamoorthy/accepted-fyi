import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isHoneypotFilled, isSubmittedTooFast } from "@/lib/utils/anti-abuse";

describe("Anti-Abuse Utilities", () => {
  describe("isHoneypotFilled", () => {
    it("should return true when honeypot has a non-empty string value", () => {
      expect(isHoneypotFilled("bot-filled-value")).toBe(true);
    });

    it("should return true when honeypot has whitespace", () => {
      expect(isHoneypotFilled(" ")).toBe(true);
    });

    it("should return false when honeypot is empty string", () => {
      expect(isHoneypotFilled("")).toBe(false);
    });

    it("should return false when honeypot is undefined", () => {
      expect(isHoneypotFilled(undefined)).toBe(false);
    });

    it("should return false when honeypot is null", () => {
      expect(isHoneypotFilled(null)).toBe(false);
    });

    it("should return false when honeypot is a number", () => {
      expect(isHoneypotFilled(123)).toBe(false);
    });
  });

  describe("isSubmittedTooFast", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return true when form submitted in under 3 seconds", () => {
      const formLoadedAt = Date.now();
      vi.advanceTimersByTime(2000);
      expect(isSubmittedTooFast(formLoadedAt)).toBe(true);
    });

    it("should return true when form submitted instantly", () => {
      const formLoadedAt = Date.now();
      expect(isSubmittedTooFast(formLoadedAt)).toBe(true);
    });

    it("should return false when form submitted after 3 seconds", () => {
      const formLoadedAt = Date.now();
      vi.advanceTimersByTime(3500);
      expect(isSubmittedTooFast(formLoadedAt)).toBe(false);
    });

    it("should return false when form submitted after 30 seconds", () => {
      const formLoadedAt = Date.now();
      vi.advanceTimersByTime(30000);
      expect(isSubmittedTooFast(formLoadedAt)).toBe(false);
    });

    it("should return true when formLoadedAt is not a number", () => {
      expect(isSubmittedTooFast("not-a-number")).toBe(true);
    });

    it("should return true when formLoadedAt is undefined", () => {
      expect(isSubmittedTooFast(undefined)).toBe(true);
    });

    it("should return true when formLoadedAt is null", () => {
      expect(isSubmittedTooFast(null)).toBe(true);
    });

    it("should return false at exactly 3 seconds", () => {
      const formLoadedAt = Date.now();
      vi.advanceTimersByTime(3000);
      expect(isSubmittedTooFast(formLoadedAt)).toBe(false);
    });
  });
});
