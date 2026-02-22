import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger } from "@/lib/logger";

describe("logger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  function parseLogOutput(spy: ReturnType<typeof vi.spyOn>): Record<string, unknown> {
    const rawOutput = spy.mock.calls[0][0] as string;
    return JSON.parse(rawOutput);
  }

  describe("info", () => {
    it("should output JSON to stdout with level, event, and timestamp", () => {
      logger.info("test.event");

      expect(consoleSpy).toHaveBeenCalledOnce();
      const parsed = parseLogOutput(consoleSpy);
      expect(parsed.level).toBe("info");
      expect(parsed.event).toBe("test.event");
      expect(parsed.timestamp).toBeDefined();
    });

    it("should include arbitrary context", () => {
      logger.info("user.login", { userId: "abc-123", method: "google" });

      const parsed = parseLogOutput(consoleSpy);
      expect(parsed.userId).toBe("abc-123");
      expect(parsed.method).toBe("google");
    });

    it("should produce valid ISO 8601 timestamp", () => {
      logger.info("test.timestamp");

      const parsed = parseLogOutput(consoleSpy);
      const timestamp = parsed.timestamp as string;
      expect(new Date(timestamp).toISOString()).toBe(timestamp);
    });
  });

  describe("warn", () => {
    it("should output JSON to stdout with warn level", () => {
      logger.warn("suspicious.activity", { ip: "1.2.3.4" });

      expect(consoleSpy).toHaveBeenCalledOnce();
      const parsed = parseLogOutput(consoleSpy);
      expect(parsed.level).toBe("warn");
      expect(parsed.event).toBe("suspicious.activity");
      expect(parsed.ip).toBe("1.2.3.4");
    });
  });

  describe("error", () => {
    it("should output JSON to stderr with error level", () => {
      logger.error("db.connection_failed");

      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      const parsed = parseLogOutput(consoleErrorSpy);
      expect(parsed.level).toBe("error");
      expect(parsed.event).toBe("db.connection_failed");
    });

    it("should serialize Error objects to { message, stack }", () => {
      const testError = new Error("connection refused");
      logger.error("db.connection_failed", { error: testError });

      const parsed = parseLogOutput(consoleErrorSpy);
      const serializedError = parsed.error as { message: string; stack: string };
      expect(serializedError.message).toBe("connection refused");
      expect(serializedError.stack).toBeDefined();
      expect(typeof serializedError.stack).toBe("string");
    });

    it("should handle non-Error objects in context without crashing", () => {
      logger.error("unexpected", { error: "string error", code: 500 });

      const parsed = parseLogOutput(consoleErrorSpy);
      expect(parsed.error).toBe("string error");
      expect(parsed.code).toBe(500);
    });

    it("should handle nested Error objects", () => {
      const innerError = new Error("timeout");
      logger.error("request.failed", { cause: innerError, url: "/api/test" });

      const parsed = parseLogOutput(consoleErrorSpy);
      const cause = parsed.cause as { message: string; stack: string };
      expect(cause.message).toBe("timeout");
      expect(parsed.url).toBe("/api/test");
    });
  });
});
