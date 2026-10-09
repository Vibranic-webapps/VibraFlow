import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordForm from "@/app/components/auth/ResetPasswordForm";

// The URL carries the reset token: never send it on as a Referer.
export const metadata: Metadata = { referrer: "no-referrer" };

// useSearchParams needs a Suspense boundary in the App Router.
export default function ResetPasswordPage() {
    return (
        <Suspense fallback={null}>
            <ResetPasswordForm />
        </Suspense>
    );
}
