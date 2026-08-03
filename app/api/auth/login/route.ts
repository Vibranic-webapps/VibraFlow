import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (typeof email !== "string" || typeof password !== "string") {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }
        const normalizedEmail = email.trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

        // Same generic error whether the email is unknown or the password is
        // wrong -> never reveal which emails are registered.
        const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;
        if (!user || !passwordOk) {
            return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
        }

        await createSession(user.id);

        return NextResponse.json({ id: user.id, email: user.email });
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
