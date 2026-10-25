import type { ReactNode } from "react";
import { Button } from "@/app/components/ui/Button";

// The one primary button of an auth screen. Disabled while the request runs, so it can't be sent twice.
export default function AuthSubmitButton({
    loading,
    loadingLabel = "Please wait…",
    children,
}: {
    loading: boolean;
    loadingLabel?: string;
    children: ReactNode;
}) {
    return (
        <Button type="submit" variant="primary" size="lg" fullWidth disabled={loading}>
            {loading ? loadingLabel : children}
        </Button>
    );
}
