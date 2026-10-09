import { NextRequest, NextResponse, after } from "next/server";
import { passwordError } from "@/lib/auth/password";
import { INVALID_RESET_LINK, resetPasswordWithToken } from "@/lib/auth/resetToken";
import { createSession } from "@/lib/auth/session";
import { reportEvent } from "@/lib/vibradex";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);
        const token: unknown = body?.token;
        const password: unknown = body?.password;

        if (typeof token !== "string" || token.length === 0) {
            return NextResponse.json({ error: INVALID_RESET_LINK }, { status: 400 });
        }
        if (typeof password !== "string") {
            return NextResponse.json({ error: "Password is required" }, { status: 400 });
        }

        // Same rules as signup. Checked before the token is touched, so a weak
        // password just asks again instead of burning the link.
        const weak = passwordError(password);
        if (weak) {
            return NextResponse.json({ error: weak }, { status: 400 });
        }

        // Unknown, expired and already-used links get the same message.
        const user = await resetPasswordWithToken(token, password);
        if (!user) {
            return NextResponse.json({ error: INVALID_RESET_LINK }, { status: 400 });
        }

        // Every old session was just deleted; log them in on the new password.
        await createSession(user.id);

        after(() => reportEvent("Password reset completed", { details: { userId: user.id } }));

        return NextResponse.json({ id: user.id, email: user.email });
    } catch (error) {
        console.error("Reset password error:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
