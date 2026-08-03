import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/auth/constants";

// How long a login lasts. 30 days = "stay logged in across visits".
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

/**
 * Hash a raw token before it touches the database.
 * Plain SHA-256 is enough here: the token is already 32 random bytes,
 * so it doesn't need the slow, salted hashing that human passwords do.
 */
function hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
}

/**
 * Create a session for a user: generate a random token, store its hash in a
 * Session row, and drop the raw token into an httpOnly cookie.
 * Must be called from a Route Handler or Server Action (it sets a cookie).
 */
export async function createSession(userId: string): Promise<void> {
    const rawToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await prisma.session.create({
        data: { hashedToken: hashToken(rawToken), userId, expiresAt },
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, rawToken, {
        httpOnly: true, // JS can't read it -> XSS can't steal it
        secure: process.env.NODE_ENV === "production", // https-only in prod
        sameSite: "lax", // CSRF defense
        path: "/",
        expires: expiresAt, // persistence: browser keeps sending it until then
    });
}

/**
 * Read the current session and return its userId, or null if there is no
 * valid session. This is the replacement for Clerk's `await auth()`.
 * Safe to call anywhere (only reads the cookie).
 */
export async function readSession(): Promise<{ userId: string } | null> {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE)?.value;
    if (!rawToken) return null;

    const session = await prisma.session.findUnique({
        where: { hashedToken: hashToken(rawToken) },
    });
    if (!session) return null;

    // Expired: clean up the row and treat as logged out.
    if (session.expiresAt < new Date()) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
        return null;
    }

    return { userId: session.userId };
}

/**
 * Destroy the current session: delete its row and clear the cookie.
 * Must be called from a Route Handler or Server Action (it clears a cookie).
 */
export async function destroySession(): Promise<void> {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE)?.value;

    if (rawToken) {
        await prisma.session
            .deleteMany({ where: { hashedToken: hashToken(rawToken) } })
            .catch(() => {});
    }

    cookieStore.delete(SESSION_COOKIE);
}
