"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import AuthShell, { AUTH_LINK_CLASS } from "./AuthShell";
import AuthField from "./AuthField";
import AuthSubmitButton from "./AuthSubmitButton";

type Mode = "login" | "signup";

const COPY = {
    login: {
        title: "Welcome back",
        subtitle: "Sign in to VibraFlow",
        submit: "Sign in",
        endpoint: "/api/auth/login",
        altText: "Need an account?",
        altHref: "/signup",
        altLabel: "Sign up",
    },
    signup: {
        title: "Create your account",
        subtitle: "Start planning with VibraFlow",
        submit: "Sign up",
        endpoint: "/api/auth/signup",
        altText: "Already have an account?",
        altHref: "/login",
        altLabel: "Sign in",
    },
} as const;

export default function AuthForm({ mode }: { mode: Mode }) {
    const c = COPY[mode];
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(c.endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.error ?? "Something went wrong");
                return;
            }
            // Cookie is set; go home and let the server re-read auth state.
            router.push("/");
            router.refresh();
        } catch {
            toast.error("Network error, please try again");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <AuthShell title={c.title} subtitle={c.subtitle}>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <AuthField
                    label="Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    disabled={submitting}
                />
                <AuthField
                    label="Password"
                    type="password"
                    required
                    minLength={mode === "signup" ? 8 : undefined}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    hint={mode === "signup" ? "At least 8 characters" : undefined}
                    disabled={submitting}
                />

                {mode === "login" && (
                    <Link href="/forgot-password" className={`${AUTH_LINK_CLASS} self-end`}>
                        Forgot password?
                    </Link>
                )}

                <AuthSubmitButton loading={submitting}>{c.submit}</AuthSubmitButton>
            </form>

            <p className="text-center text-body text-ink-soft">
                {c.altText}{" "}
                <Link href={c.altHref} className={AUTH_LINK_CLASS}>{c.altLabel}</Link>
            </p>

            <p className="text-center text-caption text-ink-soft">
                By continuing you agree to our{" "}
                <Link href="/terms" className="underline">Terms</Link> and{" "}
                <Link href="/privacy" className="underline">Privacy Policy</Link>.
            </p>
        </AuthShell>
    );
}
