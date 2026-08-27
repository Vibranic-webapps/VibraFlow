import "server-only";

// Report app events to the Vibradex diagnostics hub.
//
// Design notes:
// - Server-only: the API key must never reach the browser, so this is only ever
//   imported from route handlers / server code (never a client component).
// - Direct send, no batching: VibraFlow runs as serverless functions that freeze
//   the moment they respond, so a queue + interval-flush (like the Vibradex SDK
//   client) would lose events. We POST each event immediately instead.
// - Fail-safe: telemetry must never break or noticeably slow a user action, so
//   every call is wrapped in try/catch with a short timeout and swallows errors.

const HUB_URL = process.env.VIBRADEX_URL;
const API_KEY = process.env.VIBRADEX_API_KEY;

export type VibradexType = "info" | "warning" | "error" | "debug";
export type VibradexSeverity = "low" | "medium" | "high" | "critical";

interface ReportOptions {
    type?: VibradexType;
    severity?: VibradexSeverity;
    details?: Record<string, unknown>;
}

/**
 * Send a single diagnostic event to Vibradex.
 *
 * Defaults to an informational, low-severity event — that matters: in Vibradex,
 * `severity: "high"` marks the app as "down" and can fire alerts, so normal user
 * actions must stay `info` / `low`.
 */
export async function reportEvent(message: string, opts: ReportOptions = {}): Promise<void> {
    // If telemetry isn't configured (e.g. local dev without the keys), do nothing.
    if (!HUB_URL || !API_KEY) return;

    try {
        await fetch(`${HUB_URL}/api/diagnostics/events`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-api-key": API_KEY,
            },
            body: JSON.stringify({
                type: opts.type ?? "info",
                severity: opts.severity ?? "low",
                message,
                details: opts.details,
            }),
            // Never let a slow/unreachable hub hang the request.
            signal: AbortSignal.timeout(3000),
        });
    } catch (error) {
        // Telemetry is best-effort: log and move on, never throw.
        console.error("[vibradex] failed to report event:", error);
    }
}
