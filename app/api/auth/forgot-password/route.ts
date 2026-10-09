import { NextRequest, NextResponse, after } from "next/server";
import { requestPasswordReset } from "@/lib/auth/resetToken";

// Plausibility only (something@something.tld, sane length); the real proof
// that an address works is the mail arriving.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        const email: unknown = body?.email;

        if (typeof email !== "string") {
            return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail.length > MAX_EMAIL_LENGTH || !EMAIL_SHAPE.test(normalizedEmail)) {
            return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
        }

        // Lookup, token and mail all happen after the response is sent, and the
        // answer is identical whether or not the account exists: neither the
        // body nor the response time reveals who has an account.
        const devOrigin = request.nextUrl.origin;
        after(() => requestPasswordReset(normalizedEmail, devOrigin));

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Forgot password error:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
