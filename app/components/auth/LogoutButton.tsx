"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    async function handleLogout() {
        setLoading(true);
        try {
            await fetch("/api/auth/logout", { method: "POST" });
            router.push("/login");
            router.refresh();
        } finally {
            setLoading(false);
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={loading}
            title="Log out"
            aria-label="Log out"
            className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-white/70 backdrop-blur-md transition-colors hover:border-(--vibranic) hover:text-white disabled:opacity-50 cursor-pointer"
        >
            <LogOut size={16} />
        </button>
    );
}
