import type { ReactNode } from "react";

// Primary button styled like the submit button in AuthForm.
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
        <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-(--vibranic) py-2.5 font-medium text-black transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
            {loading ? loadingLabel : children}
        </button>
    );
}
