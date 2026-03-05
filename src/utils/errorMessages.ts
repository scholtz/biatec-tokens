/**
 * User-friendly error message utility — WCAG / UX hardening
 *
 * AC6: No user-facing error message exposes raw stack traces, internal codes, or framework
 *      exception text.
 * AC7: User-facing errors include clear next-action guidance in plain language.
 *
 * Usage:
 *   import { toUserMessage } from '../utils/errorMessages'
 *   const msg = toUserMessage(caught)
 *   // msg.title      — one-line summary for the user
 *   // msg.detail     — optional elaboration / next-step guidance
 *   // msg.diagnostic — technical detail for console/logs only (never show in UI)
 */

export interface UserErrorMessage {
  /** Short headline, safe to display in a toast / banner. */
  title: string;
  /** Longer guidance text, safe to display in an expanded error panel. */
  detail: string;
  /** Raw technical information, intended for log output only — NEVER render in UI. */
  diagnostic: string;
}

/**
 * Categorised error patterns mapped to plain-language messages.
 * Keys are case-insensitive sub-strings matched against the raw error message.
 */
const ERROR_MAP: Array<{
  pattern: RegExp;
  title: string;
  detail: string;
}> = [
  {
    pattern: /network|fetch|failed to fetch|offline|connection refused|ERR_NETWORK/i,
    title: "Connection problem",
    detail:
      "We couldn't reach the server. Please check your internet connection and try again. If the problem persists, contact support.",
  },
  {
    pattern: /401|unauthorized|unauthenticated/i,
    title: "Session expired",
    detail:
      "Your session has expired or you are not authorised to perform this action. Please sign in again.",
  },
  {
    pattern: /403|forbidden/i,
    title: "Access denied",
    detail:
      "You don't have permission to perform this action. If you believe this is an error, contact your administrator.",
  },
  {
    pattern: /404|not found/i,
    title: "Resource not found",
    detail:
      "The requested item could not be found. It may have been moved or deleted. Return to the dashboard and try again.",
  },
  {
    pattern: /409|conflict/i,
    title: "Duplicate submission",
    detail:
      "This action has already been completed or a conflicting record exists. Refresh the page to see the latest state.",
  },
  {
    pattern: /422|unprocessable/i,
    title: "Invalid information",
    detail:
      "Some of the information you provided is not valid. Please review the form and correct any highlighted fields.",
  },
  {
    pattern: /429|too many requests|rate limit/i,
    title: "Too many requests",
    detail:
      "You have sent too many requests in a short time. Please wait a moment and try again.",
  },
  {
    pattern: /5[0-9]{2}|server error|internal server|service unavailable|bad gateway/i,
    title: "Service temporarily unavailable",
    detail:
      "Our service is experiencing difficulties. Our team has been notified. Please try again in a few minutes or contact support if the issue continues.",
  },
  {
    pattern: /timeout|timed?\s*out/i,
    title: "Request timed out",
    detail:
      "The operation took longer than expected. Please check your connection and try again.",
  },
  {
    pattern: /quota|limit exceeded|storage/i,
    title: "Limit reached",
    detail:
      "You have reached a usage limit for your current plan. Please review your subscription or contact support to upgrade.",
  },
  {
    pattern: /invalid.*token|token.*invalid|jwt|malformed/i,
    title: "Authentication error",
    detail:
      "Your authentication credentials are invalid. Please sign out and sign in again.",
  },
  {
    pattern: /compliance|kyc|aml|jurisdiction/i,
    title: "Compliance check required",
    detail:
      "This action requires additional compliance verification. Complete the compliance setup to proceed.",
  },
];

/**
 * Converts any thrown value to a structured, user-safe error message.
 *
 * @param err   - The caught error (any type).
 * @returns     A {@link UserErrorMessage} with safe display content and raw diagnostic.
 *
 * @example
 * try {
 *   await api.createToken(data)
 * } catch (err) {
 *   const msg = toUserMessage(err)
 *   console.error('[token-create]', msg.diagnostic)  // log only
 *   showToast(msg.title, msg.detail)                 // show to user
 * }
 */
export function toUserMessage(err: unknown): UserErrorMessage {
  const raw = extractRawMessage(err);
  const diagnostic = buildDiagnostic(err);

  for (const entry of ERROR_MAP) {
    if (entry.pattern.test(raw)) {
      return { title: entry.title, detail: entry.detail, diagnostic };
    }
  }

  // Fallback — generic non-technical message
  return {
    title: "Something went wrong",
    detail:
      "An unexpected error occurred. Please try again. If the problem continues, contact support with the reference: " +
      buildErrorReference(err),
    diagnostic,
  };
}

/**
 * Returns only the safe title string — useful for compact toast messages.
 */
export function toUserTitle(err: unknown): string {
  return toUserMessage(err).title;
}

/**
 * Returns only the detail / guidance string.
 */
export function toUserDetail(err: unknown): string {
  return toUserMessage(err).detail;
}

// ─── Private helpers ───────────────────────────────────────────────────────────

function extractRawMessage(err: unknown): string {
  if (err == null) return "";
  if (typeof err === "string") return err;
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    const candidates = [e.message, e.statusText, e.status, e.code];
    return candidates
      .filter((v) => v != null)
      .map(String)
      .join(" ");
  }
  return String(err);
}

function buildDiagnostic(err: unknown): string {
  if (err == null) return "(null error)";
  if (typeof err === "string") return err;
  if (err instanceof Error) {
    return `${err.name}: ${err.message}${err.stack ? `\n${err.stack}` : ""}`;
  }
  try {
    return JSON.stringify(err, null, 2);
  } catch {
    return String(err);
  }
}

function buildErrorReference(err: unknown): string {
  const ts = Date.now().toString(36).toUpperCase();
  const hint =
    err instanceof Error ? err.name.slice(0, 8).toUpperCase() : "ERR";
  return `${hint}-${ts}`;
}
