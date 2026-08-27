import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-2">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <div className="flex flex-col gap-2 text-white/70">{children}</div>
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
        <div className="min-h-screen bg-(--void) text-white">
            <div className="mx-auto max-w-2xl px-5 py-12">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-white/50 transition-colors hover:text-white">
                    <ArrowLeft size={15} /> Back to VibraFlow
                </Link>

                <h1 className="mt-6 text-3xl font-semibold">{title}</h1>
                <p className="mt-1 text-sm text-white/40">Last updated: {updated}</p>

                <article className="mt-8 flex flex-col gap-6 leading-relaxed">{children}</article>

                <footer className="mt-12 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/10 pt-6 text-sm text-white/40">
                    <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
                    <Link href="/terms" className="hover:text-white">Terms of Service</Link>
                    <Link href="/" className="hover:text-white">Back to app</Link>
                </footer>
            </div>
        </div>
    );
}
