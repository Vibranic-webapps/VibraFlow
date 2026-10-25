"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/Button";
import { AccountIcon } from "@/app/components/ui/icons";
import { IconButton } from "@/app/components/ui/IconButton";
import { Sheet } from "@/app/components/ui/Sheet";

/** Account button for the top bar. Opens a small sheet with "Log out" (same endpoint as before). */
export default function AccountMenu() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
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
        <>
            <IconButton label="Account" icon={<AccountIcon />} onClick={() => setOpen(true)} />
            <Sheet open={open} onClose={() => setOpen(false)} title="Account">
                <Button variant="secondary" fullWidth onClick={handleLogout} disabled={loading}>
                    {loading ? "Logging out…" : "Log out"}
                </Button>
            </Sheet>
        </>
    );
}
