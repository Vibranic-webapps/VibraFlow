import type { ReactNode } from "react";
import { Card } from "@/app/components/ui/Card";

// Shared page for every auth screen. Sits near the top third instead of dead centre, so the
// on-screen keyboard doesn't cover the form; the page scrolls if the keyboard still needs room.
export default function AuthShell({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: string;
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-dvh flex-col items-center bg-paper px-4 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
            <div className="flex w-full max-w-column flex-1 flex-col justify-start gap-6 sm:justify-center">
                <p className="font-title text-center text-heading font-semibold text-accent-deep">VibraFlow</p>
                <Card className="flex flex-col gap-5">
                    <div className="text-center">
                        <h1 className="font-title text-title font-semibold text-ink">{title}</h1>
                        {subtitle && <p className="mt-1 text-body text-ink-soft">{subtitle}</p>}
                    </div>
                    {children}
                </Card>
            </div>
        </div>
    );
}

/** Text link on the auth screens. min-h-11 = 44px tap target. */
export const AUTH_LINK_CLASS =
    "focus-ring inline-flex min-h-11 items-center rounded-input font-semibold text-accent-deep underline decoration-2 underline-offset-2";
