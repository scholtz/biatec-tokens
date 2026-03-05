/**
 * Unit tests for src/utils/errorMessages.ts
 *
 * Covers:
 * - AC6: No raw technical text leaks to UI
 * - AC7: All error categories produce plain-language guidance with next steps
 * - Edge cases: null, undefined, string errors, non-Error objects
 */
import { describe, it, expect } from "vitest";
import {
  toUserMessage,
  toUserTitle,
  toUserDetail,
  type UserErrorMessage,
} from "../errorMessages";

// ─── helpers ──────────────────────────────────────────────────────────────────

function isUserSafe(msg: UserErrorMessage): boolean {
  const combined = `${msg.title} ${msg.detail}`;
  // Should never expose stack traces, framework tokens, or exception prefixes
  const forbiddenPatterns = [
    /at Object\./,
    /Error: /,
    /\.ts:\d+/,
    /ReferenceError/,
    /TypeError:/,
    /Cannot read propert/,
    /undefined is not/,
    /vue\/dist/,
    /webpack:\/\//,
  ];
  return forbiddenPatterns.every((p) => !p.test(combined));
}

function hasNextStep(msg: UserErrorMessage): boolean {
  // AC7: detail must include actionable guidance
  const actionWords = [
    "please",
    "try",
    "contact",
    "check",
    "sign",
    "review",
    "return",
    "refresh",
    "wait",
    "complete",
    "upgrade",
  ];
  const detailLower = msg.detail.toLowerCase();
  return actionWords.some((w) => detailLower.includes(w));
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe("errorMessages – toUserMessage", () => {
  describe("network / connectivity errors", () => {
    it("maps network errors to user-friendly message", () => {
      const msg = toUserMessage(new Error("Failed to fetch"));
      expect(msg.title).toBe("Connection problem");
      expect(isUserSafe(msg)).toBe(true);
      expect(hasNextStep(msg)).toBe(true);
    });

    it("maps ERR_NETWORK to connection problem", () => {
      const msg = toUserMessage(new Error("ERR_NETWORK_CHANGED"));
      expect(msg.title).toBe("Connection problem");
    });

    it("maps offline error string", () => {
      const msg = toUserMessage("connection refused");
      expect(msg.title).toBe("Connection problem");
    });
  });

  describe("HTTP status errors", () => {
    it("maps 401 Unauthorized to session expired", () => {
      const msg = toUserMessage({ status: 401, statusText: "Unauthorized" });
      expect(msg.title).toBe("Session expired");
      expect(hasNextStep(msg)).toBe(true);
    });

    it("maps 403 Forbidden to access denied", () => {
      const msg = toUserMessage(new Error("403 Forbidden"));
      expect(msg.title).toBe("Access denied");
      expect(hasNextStep(msg)).toBe(true);
    });

    it("maps 404 Not Found", () => {
      const msg = toUserMessage(new Error("404 not found"));
      expect(msg.title).toBe("Resource not found");
      expect(hasNextStep(msg)).toBe(true);
    });

    it("maps 409 Conflict to duplicate submission", () => {
      const msg = toUserMessage(new Error("409 conflict"));
      expect(msg.title).toBe("Duplicate submission");
    });

    it("maps 422 Unprocessable to invalid information", () => {
      const msg = toUserMessage({ message: "422 unprocessable entity" });
      expect(msg.title).toBe("Invalid information");
    });

    it("maps 429 Too Many Requests", () => {
      const msg = toUserMessage(new Error("429 rate limit exceeded"));
      expect(msg.title).toBe("Too many requests");
    });

    it("maps 500 server error", () => {
      const msg = toUserMessage(new Error("500 Internal Server Error"));
      expect(msg.title).toBe("Service temporarily unavailable");
      expect(hasNextStep(msg)).toBe(true);
    });

    it("maps 503 Service Unavailable", () => {
      const msg = toUserMessage({ status: 503, message: "service unavailable" });
      expect(msg.title).toBe("Service temporarily unavailable");
    });
  });

  describe("timeout errors", () => {
    it("maps timeout error", () => {
      const msg = toUserMessage(new Error("Request timed out"));
      expect(msg.title).toBe("Request timed out");
      expect(hasNextStep(msg)).toBe(true);
    });

    it("maps RequestTimedOut (no-space variant) to timed out", () => {
      const msg = toUserMessage(new Error("RequestTimedOut"));
      expect(msg.title).toBe("Request timed out");
    });

    it("maps timeout keyword", () => {
      const msg = toUserMessage(new Error("connection timeout"));
      expect(msg.title).toBe("Request timed out");
    });
  });

  describe("auth / token errors", () => {
    it("maps JWT/token errors to authentication error", () => {
      const msg = toUserMessage(new Error("invalid token"));
      expect(msg.title).toBe("Authentication error");
      expect(hasNextStep(msg)).toBe(true);
    });

    it("maps malformed token error", () => {
      const msg = toUserMessage("malformed JWT");
      expect(msg.title).toBe("Authentication error");
    });
  });

  describe("compliance errors", () => {
    it("maps KYC-related errors", () => {
      const msg = toUserMessage(new Error("KYC verification required"));
      expect(msg.title).toBe("Compliance check required");
      expect(hasNextStep(msg)).toBe(true);
    });

    it("maps jurisdiction error", () => {
      const msg = toUserMessage("jurisdiction not supported");
      expect(msg.title).toBe("Compliance check required");
    });
  });

  describe("quota / limits", () => {
    it("maps quota exceeded error", () => {
      const msg = toUserMessage(new Error("quota exceeded"));
      expect(msg.title).toBe("Limit reached");
      expect(hasNextStep(msg)).toBe(true);
    });
  });

  describe("fallback / generic errors", () => {
    it("produces a user-safe fallback for unknown errors", () => {
      const msg = toUserMessage(new Error("Something totally unexpected xyz123"));
      expect(msg.title).toBe("Something went wrong");
      expect(isUserSafe(msg)).toBe(true);
      expect(hasNextStep(msg)).toBe(true);
    });

    it("includes an error reference in fallback detail", () => {
      const msg = toUserMessage(new Error("unknown failure"));
      expect(msg.detail).toMatch(/[A-Z0-9]+-[A-Z0-9]+/); // error reference pattern
    });

    it("never exposes stack trace text in title or detail", () => {
      const err = new Error("Something went wrong");
      err.stack = "TypeError: foo at Object.bar (bundle.ts:123:45)";
      const msg = toUserMessage(err);
      expect(isUserSafe(msg)).toBe(true);
    });
  });

  describe("edge cases – unusual inputs", () => {
    it("handles null gracefully", () => {
      const msg = toUserMessage(null);
      expect(msg.title).toBeTypeOf("string");
      expect(msg.title.length).toBeGreaterThan(0);
      expect(isUserSafe(msg)).toBe(true);
    });

    it("handles undefined gracefully", () => {
      const msg = toUserMessage(undefined);
      expect(msg.title).toBeTypeOf("string");
      expect(isUserSafe(msg)).toBe(true);
    });

    it("handles plain string errors", () => {
      const msg = toUserMessage("something failed");
      expect(msg.title).toBeTypeOf("string");
      expect(isUserSafe(msg)).toBe(true);
    });

    it("handles object without message property", () => {
      const msg = toUserMessage({ code: "UNKNOWN", status: 0 });
      expect(msg.title).toBeTypeOf("string");
      expect(isUserSafe(msg)).toBe(true);
    });

    it("handles non-serialisable objects gracefully", () => {
      const circular: Record<string, unknown> = {};
      circular.self = circular;
      expect(() => toUserMessage(circular)).not.toThrow();
      const msg = toUserMessage(circular);
      expect(msg.title).toBeTypeOf("string");
    });
  });

  describe("diagnostic field", () => {
    it("preserves raw details in diagnostic (for logging)", () => {
      const err = new Error("Internal DB error: constraint violation");
      const msg = toUserMessage(err);
      expect(msg.diagnostic).toContain("Internal DB error");
    });

    it("diagnostic is separate from user-visible fields", () => {
      const err = new Error("Raw stack trace data");
      const msg = toUserMessage(err);
      // Diagnostic may contain raw info — that's intentional for logging
      // But title and detail must be user-safe
      expect(isUserSafe(msg)).toBe(true);
    });
  });
});

describe("errorMessages – toUserTitle", () => {
  it("returns just the title string", () => {
    const title = toUserTitle(new Error("network error"));
    expect(title).toBe("Connection problem");
    expect(typeof title).toBe("string");
  });
});

describe("errorMessages – toUserDetail", () => {
  it("returns just the detail string", () => {
    const detail = toUserDetail(new Error("network error"));
    expect(detail).toContain("internet");
    expect(typeof detail).toBe("string");
  });
});

describe("AC5/AC6/AC7 compliance assertions", () => {
  const allErrorTypes = [
    new Error("Failed to fetch"),
    new Error("401 Unauthorized"),
    new Error("403 Forbidden"),
    new Error("404 not found"),
    new Error("500 Internal Server Error"),
    new Error("Request timed out"),
    new Error("invalid token"),
    new Error("KYC required"),
    new Error("quota exceeded"),
    null,
    undefined,
    "plain string error",
    { status: 500 },
  ];

  allErrorTypes.forEach((err, i) => {
    it(`error type[${i}] produces user-safe message with next step (AC6, AC7)`, () => {
      const msg = toUserMessage(err);
      expect(isUserSafe(msg)).toBe(true);
      expect(hasNextStep(msg)).toBe(true);
      expect(msg.title.length).toBeGreaterThan(0);
      expect(msg.detail.length).toBeGreaterThan(0);
    });
  });
});
