"use client";
import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthShell from "./AuthShell";
import AuthField from "./AuthField";
import AuthSubmitButton from "./AuthSubmitButton";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";

const COPY = {
    title: "Choose a new password",
    subtitle: "Pick something you haven't used before",
    submit: "Reset password",
    hint: `At least ${MIN_PASSWORD_LENGTH} characters`,
    tooShort: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    mismatch: "Passwords don't match",
    networkError: "Network error, please try again",
    genericError: "Something went wrong",
    missingTokenTitle: "Reset link missing",
    missingTokenBody: "This page needs a reset link from your email. You can request a new one.",
} as const;

// min-h-11 = 44px tap target
const LINK_CLASS = "inline-flex min-h-11 items-center text-(--vibranic) hover:underline";

export default function ResetPasswordForm() {
    const router = useRouter();
    const token = useSearchParams().get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // True once the server rejected the token, so we can offer a fresh link.
    const [serverRejected, setServerRejected] = useState(false);

    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmRef = useRef<HTMLInputElement>(null);

    if (!token) {
        return (
            <AuthShell title={COPY.missingTokenTitle}>
                <p role="status" className="text-center text-sm text-white/70">
                    {COPY.missingTokenBody}
                </p>
                <p className="text-center text-sm">
                    <Link href="/forgot-password" className={LINK_CLASS}>
                        Request a new link
                    </Link>
                </p>
            </AuthShell>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setServerRejected(false);

        // Client-side checks mirror the signup rules; focus the offending field.
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(COPY.tooShort);
            passwordRef.current?.focus();
            return;
        }
        if (password !== confirm) {
            setError(COPY.mismatch);
            confirmRef.current?.focus();
            return;
        }

        setSubmitting(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error ?? COPY.genericError);
                // 400 = bad/expired/used token; a 500 is worth a plain retry instead.
                setServerRejected(res.status === 400);
                return;
            }
            // Session cookie is set; go home and let the server re-read auth state.
            router.replace("/");
            router.refresh();
        } catch {
            setError(COPY.networkError);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthShell title={COPY.title} subtitle={COPY.subtitle}>
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <AuthField
                    label="New password"
                    type="password"
                    required
                    autoFocus
                    inputRef={passwordRef}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    hint={COPY.hint}
                    disabled={submitting}
                />
                <AuthField
                    label="Confirm new password"
                    type="password"
                    required
                    inputRef={confirmRef}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    disabled={submitting}
                />

                {/* Always rendered so screen readers announce the text when it appears */}
                <p role="alert" className="text-sm text-red-400 empty:hidden -my-2">
                    {error}
                </p>

                {serverRejected && (
                    <Link href="/forgot-password" className={`${LINK_CLASS} -my-2`}>
                        Request a new link
                    </Link>
                )}

                <AuthSubmitButton loading={submitting}>{COPY.submit}</AuthSubmitButton>
            </form>
        </AuthShell>
    );
}
