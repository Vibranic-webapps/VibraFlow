import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Section } from "@/app/components/legal/LegalPage";

export const metadata: Metadata = {
    title: "Terms of Service — VibraFlow",
    description: "The terms that govern your use of VibraFlow.",
};

const OWNER = "Kilian Frederix";
const CONTACT = "kilianfrederix@gmail.com";
const JURISDICTION = "Belgium";

export default function TermsPage() {
    return (
        <LegalPage title="Terms of Service" updated="27 August 2026">
            <p className="text-white/70">
                These Terms of Service (&ldquo;Terms&rdquo;) govern your use of VibraFlow (the
                &ldquo;Service&rdquo;), operated by {OWNER}. By creating an account or using the Service,
                you agree to these Terms. If you do not agree, please do not use the Service.
            </p>

            <Section title="1. The Service">
                <p>VibraFlow is a personal planning application for managing tasks, a calendar, and todo lists. It is offered as a personal project and may change or be discontinued at any time.</p>
            </Section>

            <Section title="2. Your account">
                <p>You must provide a valid email address and keep your login credentials confidential. You are responsible for all activity under your account. Notify us promptly of any unauthorized use.</p>
            </Section>

            <Section title="3. Acceptable use">
                <p>You agree not to misuse the Service — including attempting to break, overload, or gain unauthorized access to it, or using it for any unlawful purpose.</p>
            </Section>

            <Section title="4. Your content">
                <p>You retain ownership of the content you create in the Service. You grant us the limited right to store and display that content solely to provide the Service to you. You are responsible for the content you add.</p>
            </Section>

            <Section title="5. Availability and &ldquo;as is&rdquo;">
                <p>The Service is provided <strong className="text-white/90">&ldquo;as is&rdquo; and &ldquo;as available&rdquo;</strong>, without warranties of any kind. We do not guarantee that it will be uninterrupted, error-free, or that data will never be lost. Keep your own backups of anything important.</p>
            </Section>

            <Section title="6. Limitation of liability">
                <p>To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages, or for any loss of data, arising from your use of the Service.</p>
            </Section>

            <Section title="7. Termination">
                <p>You may stop using the Service and delete your account at any time. We may suspend or terminate access if these Terms are violated or if necessary to protect the Service.</p>
            </Section>

            <Section title="8. Changes to these Terms">
                <p>We may update these Terms from time to time. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</p>
            </Section>

            <Section title="9. Governing law">
                <p>These Terms are governed by the laws of {JURISDICTION}, without regard to conflict-of-law rules.</p>
            </Section>

            <Section title="10. Contact">
                <p>Questions about these Terms? Email <a href={`mailto:${CONTACT}`} className="text-(--vibranic) hover:underline">{CONTACT}</a>.</p>
                <p className="text-sm text-white/40">See also our <Link href="/privacy" className="text-(--vibranic) hover:underline">Privacy Policy</Link>.</p>
            </Section>
        </LegalPage>
    );
}
