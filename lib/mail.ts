import "server-only";
import { reportEvent } from "@/lib/vibradex";

// Email sending via Resend (same approach as Vibrafit / Vibravault).
//
// Degrades deliberately: with no RESEND_API_KEY it logs instead of throwing.
// That keeps the password-reset flow testable locally, and a missing key or a
// Resend outage can never turn "forgot password" into an error for the user:
// the caller gets the same neutral response either way.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "VibraFlow <noreply@kilianfrederix.net>";

interface SendArgs {
    to: string;
    subject: string;
    html: string;
    text: string;
}

/** Send one email. Never throws: failures are logged and reported to Vibradex. */
export async function sendMail({ to, subject, html, text }: SendArgs): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM ?? DEFAULT_FROM;

    if (!apiKey) {
        // Production: a reset link in the logs is a working account-takeover
        // token (and Vercel logs can reach log drains). Say only that it failed.
        if (process.env.NODE_ENV === "production") {
            console.error("[mail] RESEND_API_KEY missing - mail NOT sent");
            return;
        }
        console.warn("[mail] RESEND_API_KEY not set - logging instead of sending");
        console.warn(`[mail] to=${to} subject=${subject}\n${text}`);
        return;
    }

    try {
        const res = await fetch(RESEND_ENDPOINT, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ from, to, subject, html, text }),
            signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) {
            // e.g. rejected key, unverified domain, daily quota hit.
            const detail = (await res.text().catch(() => "")).slice(0, 300);
            await reportFailure(`Resend responded ${res.status}`, { status: res.status, detail });
        }
    } catch (error) {
        await reportFailure(error instanceof Error ? error.message : String(error));
    }
}

// The recipient is deliberately left out of logs and telemetry (personal data).
async function reportFailure(reason: string, details: Record<string, unknown> = {}) {
    console.error("[mail] send failed:", reason);
    await reportEvent("Email send failed", {
        type: "error",
        severity: "medium", // not "high": that marks the whole app as down in Vibradex
        details: { reason, ...details },
    });
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

// Colours are VibraFlow's theme tokens from app/globals.css, inlined because
// mail clients don't support CSS variables:
//   --void #05060D (page) · --space-raised #12152A (card) · --vibranic #7C6CFF (accent)
//   --text-primary #EAECF5 (text) · muted #A9ACBC = --text-primary at ~70% on the card
//   · border #2A2C3F = the app's border-white/10 on the card.
// Button text is --void on --vibranic, like the app's own primary buttons.
export function resetEmail(link: string) {
    const href = escapeHtml(link);

    const text =
        `Reset your VibraFlow password:\n\n${link}\n\n` +
        `This link works once and expires in 1 hour.\n` +
        `If you didn't ask for this, ignore this email - nothing has changed.`;

    const html = `
<div style="margin:0;padding:32px 16px;background:#05060D;color:#EAECF5;
            font-family:Inter,ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:460px;margin:0 auto;background:#12152A;border:1px solid #2A2C3F;
              border-radius:16px;padding:32px">
    <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.14em;
              text-transform:uppercase;color:#7C6CFF">VibraFlow</p>
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#EAECF5">Reset your password</h1>
    <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#A9ACBC">
      Click the button below to choose a new password. The link works once and expires in 1 hour.
    </p>
    <a href="${href}"
       style="display:inline-block;padding:12px 22px;background:#7C6CFF;color:#05060D;
              font-weight:600;font-size:15px;text-decoration:none;border-radius:10px">
      Choose a new password
    </a>
    <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#A9ACBC">
      Button not working? Paste this link into your browser:<br>
      <a href="${href}" style="color:#7C6CFF;word-break:break-all">${href}</a>
    </p>
    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#A9ACBC">
      If you didn't ask for this, ignore this email &mdash; nothing has changed.
    </p>
  </div>
</div>`;

    return { subject: "Reset your VibraFlow password", text, html };
}
