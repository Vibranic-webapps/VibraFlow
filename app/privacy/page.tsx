import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { Section } from "@/app/components/legal/LegalPage";

export const metadata: Metadata = {
    title: "Privacy Policy — VibraFlow",
    description: "How VibraFlow collects, uses, and protects your data.",
};

// TODO: replace the bracketed placeholders before publishing.
const OWNER = "[Your legal name]";
const CONTACT = "kilianfrederix@gmail.com";
const JURISDICTION = "[Your country]";

export default function PrivacyPage() {
    return (
        <LegalPage title="Privacy Policy" updated="27 August 2026">
            <p className="text-white/70">
                This Privacy Policy explains how {OWNER} (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects, uses,
                and protects your personal data when you use VibraFlow (the &ldquo;Service&rdquo;). We are the
                data controller for the purposes of the EU General Data Protection Regulation (GDPR).
            </p>

            <Section title="1. Data we collect">
                <ul className="flex list-disc flex-col gap-1 pl-5">
                    <li><strong className="text-white/90">Account data</strong> — your email address and a securely hashed version of your password (we never store your password in plain text).</li>
                    <li><strong className="text-white/90">Content you create</strong> — tasks, categories, todo columns, and related details you add to the Service.</li>
                    <li><strong className="text-white/90">Technical data</strong> — a single essential session cookie used to keep you logged in (see &ldquo;Cookies&rdquo; below).</li>
                </ul>
                <p>We do <strong className="text-white/90">not</strong> use analytics or advertising trackers, and we do not sell your data to anyone.</p>
            </Section>

            <Section title="2. How we use your data">
                <p>We process your data solely to provide the Service: to authenticate you, store the content you create, and let you access it across sessions and devices.</p>
            </Section>

            <Section title="3. Legal basis (GDPR)">
                <p>We process your data on the basis of <strong className="text-white/90">performance of a contract</strong> (providing the Service you signed up for). Where required, we rely on your <strong className="text-white/90">consent</strong>, which you may withdraw at any time.</p>
            </Section>

            <Section title="4. Cookies">
                <p>VibraFlow uses a single <strong className="text-white/90">essential</strong> cookie to keep you signed in. It is an <code className="rounded bg-white/10 px-1 text-white/85">httpOnly</code> session cookie containing a random token — it cannot be read by JavaScript and holds no personal information. We use no tracking, analytics, or advertising cookies, so no cookie consent banner is required.</p>
            </Section>

            <Section title="5. Where your data is stored">
                <p>Your data is stored in a PostgreSQL database hosted by Neon in the EU (Frankfurt) region, and the Service is hosted on Vercel. These providers process data on our behalf under their respective data-processing agreements.</p>
            </Section>

            <Section title="6. Data retention">
                <p>We keep your data for as long as your account is active. When you delete your account, your personal data and content are removed. Expired login sessions are deleted automatically.</p>
            </Section>

            <Section title="7. Your rights">
                <p>Under the GDPR you have the right to access, correct, export, or delete your personal data, to restrict or object to its processing, and to withdraw consent. You may also lodge a complaint with your local data protection authority.</p>
                <p>To exercise any of these rights, contact us at <a href={`mailto:${CONTACT}`} className="text-(--vibranic) hover:underline">{CONTACT}</a>.</p>
            </Section>

            <Section title="8. Security">
                <p>Passwords are hashed with bcrypt, sessions use random tokens stored only as hashes, cookies are <code className="rounded bg-white/10 px-1 text-white/85">httpOnly</code> and <code className="rounded bg-white/10 px-1 text-white/85">secure</code> in production, and all traffic is served over HTTPS. No system is perfectly secure, but we take reasonable measures to protect your data.</p>
            </Section>

            <Section title="9. Children">
                <p>The Service is not intended for anyone under the age of 16, and we do not knowingly collect data from children.</p>
            </Section>

            <Section title="10. Changes to this policy">
                <p>We may update this policy from time to time. Material changes will be reflected by the &ldquo;Last updated&rdquo; date above.</p>
            </Section>

            <Section title="11. Contact">
                <p>Questions about this policy or your data? Email <a href={`mailto:${CONTACT}`} className="text-(--vibranic) hover:underline">{CONTACT}</a>. This Service is operated from {JURISDICTION}.</p>
                <p className="text-sm text-white/40">See also our <Link href="/terms" className="text-(--vibranic) hover:underline">Terms of Service</Link>.</p>
            </Section>
        </LegalPage>
    );
}
