"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

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
        <div className="min-h-screen flex items-center justify-center px-4 bg-(--void) text-white">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 flex flex-col gap-5"
            >
                <div className="text-center">
                    <h1 className="text-2xl font-semibold">{c.title}</h1>
                    <p className="text-white/50 text-sm mt-1">{c.subtitle}</p>
                </div>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-white/70">Email</span>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-(--vibranic) transition-colors"
                    />
                </label>

                <label className="flex flex-col gap-1.5 text-sm">
                    <span className="text-white/70">Password</span>
                    <input
                        type="password"
                        required
                        minLength={mode === "signup" ? 8 : undefined}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete={mode === "signup" ? "new-password" : "current-password"}
                        className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 outline-none focus:border-(--vibranic) transition-colors"
                    />
                    {mode === "signup" && (
                        <span className="text-white/40 text-xs">At least 8 characters</span>
                    )}
                </label>

                <button
                    type="submit"
                    disabled={submitting}
                    className="mt-2 rounded-lg bg-(--vibranic) py-2.5 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                >
                    {submitting ? "Please wait…" : c.submit}
                </button>

                <p className="text-center text-sm text-white/50">
                    {c.altText}{" "}
                    <Link href={c.altHref} className="text-(--vibranic) hover:underline">
                        {c.altLabel}
                    </Link>
                </p>

                <p className="text-center text-xs text-white/30">
                    By continuing you agree to our{" "}
                    <Link href="/terms" className="underline hover:text-white/60">Terms</Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="underline hover:text-white/60">Privacy Policy</Link>.
                </p>
            </form>
        </div>
    );
}
