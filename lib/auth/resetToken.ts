import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { hashToken } from "@/lib/auth/session";
import { sendMail, resetEmail } from "@/lib/mail";
import { reportEvent } from "@/lib/vibradex";

// "Forgot password" tokens. Same pattern as sessions: the emailed link carries
// the raw token, the DB stores only its SHA-256 hash, so a database leak
// yields no usable reset links.

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour
// One mail per account per 2 minutes: protects the shared Resend free quota
// (100/day) and the user's inbox from someone hammering the form.
const RESET_COOLDOWN_MS = 1000 * 60 * 2;
// A reset token is 32 random bytes as hex; anything else can't be one.
const TOKEN_SHAPE = /^[0-9a-f]{64}$/;

export const INVALID_RESET_LINK = "This reset link is invalid or has expired.";

/**
 * Base URL for links in emails. Production MUST use APP_URL: the Host header is
 * client-controlled, and trusting it would let an attacker point a victim's
 * reset link at their own domain. The request origin is only a dev convenience.
 */
function appBaseUrl(devOrigin: string): string | null {
    const configured = process.env.APP_URL?.trim().replace(/\/+$/, "");
    if (configured) return configured;
    if (process.env.NODE_ENV !== "production") return devOrigin;
    return null;
}

/**
 * Do the actual "forgot password" work for an already-normalized email.
 * Runs AFTER the response is sent (via `after()`), so nothing here may change
 * what the caller sees, and it never throws.
 */
export async function requestPasswordReset(email: string, devOrigin: string): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true },
        });
        if (!user) return;

        const base = appBaseUrl(devOrigin);
        if (!base) {
            console.error("[auth] APP_URL is not set - cannot build a reset link, nothing sent");
            return;
        }

        const recent = await prisma.passwordResetToken.findFirst({
            where: { userId: user.id, createdAt: { gt: new Date(Date.now() - RESET_COOLDOWN_MS) } },
            select: { id: true },
        });
        if (recent) return;

        const rawToken = crypto.randomBytes(32).toString("hex");

        // Only the newest link works: issuing one kills any older ones.
        await prisma.$transaction([
            prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
            prisma.passwordResetToken.create({
                data: {
                    hashedToken: hashToken(rawToken),
                    userId: user.id,
                    expiresAt: new Date(Date.now() + RESET_TTL_MS),
                },
            }),
        ]);

        const { subject, text, html } = resetEmail(`${base}/reset-password?token=${rawToken}`);
        await sendMail({ to: user.email, subject, text, html });
    } catch (error) {
        console.error("[auth] password reset request failed:", error);
        await reportEvent("Password reset request failed", {
            type: "error",
            severity: "medium",
            details: { reason: error instanceof Error ? error.message : String(error) },
        });
    }
}

/**
 * Redeem a reset token: set the new password, kill every reset token and every
 * session of that user (log out everywhere), all in one transaction.
 * Returns the user, or null when the token is malformed, unknown, expired or
 * was just used by a concurrent request. The password must already be validated.
 */
export async function resetPasswordWithToken(
    rawToken: string,
    newPassword: string,
): Promise<{ id: string; email: string } | null> {
    if (!TOKEN_SHAPE.test(rawToken)) return null;

    const record = await prisma.passwordResetToken.findUnique({
        where: { hashedToken: hashToken(rawToken) },
        select: { id: true, expiresAt: true, user: { select: { id: true, email: true } } },
    });
    if (!record || record.expiresAt < new Date()) return null;

    const passwordHash = await hashPassword(newPassword);

    const claimed = await prisma.$transaction(async (tx) => {
        // Claim the token by deleting it: two simultaneous submits of the same
        // link can't both succeed (the loser deletes 0 rows and rolls back).
        const { count } = await tx.passwordResetToken.deleteMany({
            where: { id: record.id, expiresAt: { gt: new Date() } },
        });
        if (count === 0) return false;

        await tx.user.update({ where: { id: record.user.id }, data: { passwordHash } });
        await tx.passwordResetToken.deleteMany({ where: { userId: record.user.id } });
        // If someone else holds a stolen session, a new password must evict them.
        await tx.session.deleteMany({ where: { userId: record.user.id } });
        return true;
    });

    return claimed ? record.user : null;
}
