import type { ReactNode } from "react";

// Page shell + glass card shared by the forgot/reset password screens.
// Mirrors the markup of AuthForm so all auth screens look identical.
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
        <div className="min-h-screen flex items-center justify-center px-4 bg-(--void) text-white">
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-8 flex flex-col gap-5">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold">{title}</h1>
                    {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
                </div>
                {children}
            </div>
        </div>
    );
}
