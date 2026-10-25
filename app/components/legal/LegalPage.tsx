import Link from "next/link";
import { ChevronLeftIcon } from "@/app/components/ui/icons";

// min-h-11 = 44px tap target
const NAV_LINK = "focus-ring inline-flex min-h-11 items-center rounded-input font-semibold text-accent-deep underline decoration-2 underline-offset-2";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-2">
            <h2 className="font-title text-lead font-semibold text-ink">{title}</h2>
            <div className="flex flex-col gap-2 text-body text-ink">{children}</div>
        </section>
    );
}

export default function LegalPage({
    title,
    updated,
    children,
}: {
    title: string;
    updated: string;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-dvh bg-paper text-ink">
            <div className="mx-auto max-w-column px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:max-w-2xl sm:px-5">
                <Link href="/" className={NAV_LINK}>
                    <ChevronLeftIcon aria-hidden="true" /> Back to VibraFlow
                </Link>

                <h1 className="font-title mt-4 text-title font-semibold text-ink">{title}</h1>
                <p className="mt-1 text-caption text-ink-soft">Last updated: {updated}</p>

                <article className="mt-6 flex flex-col gap-6 leading-relaxed">{children}</article>

                <footer className="line-t mt-10 flex flex-wrap gap-x-4 pt-4 text-body">
                    <Link href="/privacy" className={NAV_LINK}>Privacy Policy</Link>
                    <Link href="/terms" className={NAV_LINK}>Terms of Service</Link>
                    <Link href="/" className={NAV_LINK}>Back to app</Link>
                </footer>
            </div>
        </div>
    );
}
