"use client";
import { useState } from "react";
import Link from "next/link";
import AuthShell, { AUTH_LINK_CLASS } from "./AuthShell";
import AuthField from "./AuthField";
import AuthSubmitButton from "./AuthSubmitButton";

const COPY = {
    title: "Forgot your password?",
    subtitle: "Enter your email and we'll send you a reset link",
    submit: "Send reset link",
    // Neutral on purpose: never reveal whether an account exists for this email.
    sent: "If an account exists for that email, we've sent a reset link. It expires in 1 hour.",
    networkError: "Network error, please try again",
    genericError: "Something went wrong",
} as const;


export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error ?? COPY.genericError);
                return;
            }
            setSent(true);
        } catch {
            setError(COPY.networkError);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthShell title={COPY.title} subtitle={sent ? undefined : COPY.subtitle}>
            {sent ? (
                <p role="status" className="text-center text-body text-ink">
                    {COPY.sent}
                </p>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <AuthField
                        label="Email"
                        type="email"
                        required
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        disabled={submitting}
                    />

                    {/* Always rendered so screen readers announce the text when it appears */}
                    <p role="alert" className="text-caption font-semibold text-danger empty:hidden">
                        {error}
                    </p>

                    <AuthSubmitButton loading={submitting}>{COPY.submit}</AuthSubmitButton>
                </form>
            )}

            <p className="text-center text-body">
                <Link href="/login" className={AUTH_LINK_CLASS}>
                    Back to sign in
                </Link>
            </p>
        </AuthShell>
    );
}
