import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        // Basic validation.
        if (typeof email !== "string" || typeof password !== "string") {
            return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
        }
        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail.includes("@")) {
            return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
        }
        if (password.length < 8) {
            return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
        }

        // Is the email already taken?
        const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (existing) {
            return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);
        const user = await prisma.user.create({
            data: { email: normalizedEmail, passwordHash },
        });

        // Log them in right away.
        await createSession(user.id);

        return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
