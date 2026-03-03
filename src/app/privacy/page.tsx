import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Privacy Policy — accepted.fyi",
  description:
    "How accepted.fyi collects, uses, and protects your data. We never sell your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="flex min-h-screen flex-col bg-slate-950">
      {/* Nav */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-bold text-white tracking-tight"
          >
            accepted
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              .fyi
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/schools"
              className="text-sm text-slate-400 transition-colors hover:text-white"
            >
              Browse Schools
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-slate-900 transition-all hover:bg-slate-100 hover:shadow-lg hover:shadow-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <article className="mx-auto w-full max-w-3xl px-6 pb-24 pt-32">
        <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: March 2, 2026
        </p>

        <div className="mt-12 space-y-10 text-slate-300 leading-relaxed">
          <Section title="1. Introduction">
            <p>
              accepted.fyi (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
              is a crowdsourced platform where students share college admissions
              outcomes. This Privacy Policy explains what data we collect, how we
              use it, and your rights regarding that data.
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <h4 className="mt-4 font-semibold text-white">
              Account information
            </h4>
            <p>
              When you sign in with Google, we receive your name, email address,
              and profile picture from Google. We use this solely to authenticate
              your account and do not display your real name publicly.
            </p>

            <h4 className="mt-4 font-semibold text-white">
              Admissions data you submit
            </h4>
            <p>
              When you submit an admissions result, you provide information such
              as the school name, admission decision, application round, GPA,
              SAT/ACT scores, intended major, extracurriculars, and demographic
              context (e.g., state, school type). All submissions are displayed
              anonymously — your name and email are never shown to other users.
            </p>

            <h4 className="mt-4 font-semibold text-white">
              Usage data
            </h4>
            <p>
              We collect standard analytics data (pages visited, referral
              source, device type) through Vercel Analytics and PostHog to
              improve the product. This data is aggregated and not linked to your
              identity.
            </p>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">
                  Anonymized aggregation:
                </strong>{" "}
                Your admissions data is combined with other submissions to
                generate aggregate statistics (e.g., acceptance rates, average
                GPAs) displayed on school pages.
              </li>
              <li>
                <strong className="text-white">
                  Individual profiles:
                </strong>{" "}
                Your submission may be shown as an individual anonymized profile
                to other signed-in users who have also submitted data.
              </li>
              <li>
                <strong className="text-white">
                  Product improvement:
                </strong>{" "}
                We use aggregated analytics to understand how people use the
                platform and improve features.
              </li>
              <li>
                <strong className="text-white">
                  We never sell your data.
                </strong>{" "}
                We do not sell, rent, or share your personal information with
                third parties for their marketing purposes.
              </li>
            </ul>
          </Section>

          <Section title="4. Publicly Sourced Data">
            <p>
              Some admissions data on accepted.fyi is sourced from public
              sources, including Reddit (r/collegeresults) and government
              databases (College Scorecard, IPEDS). This data is clearly labeled
              with its source and is never mixed with user-submitted data without
              disclosure. Publicly sourced submissions are not associated with
              any user account.
            </p>
          </Section>

          <Section title="5. Third-Party Services">
            <p>We use the following third-party services:</p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">Supabase</strong> — database
                hosting and authentication (Google OAuth)
              </li>
              <li>
                <strong className="text-white">Vercel</strong> — application
                hosting and analytics
              </li>
              <li>
                <strong className="text-white">PostHog</strong> — product
                analytics (anonymized)
              </li>
              <li>
                <strong className="text-white">Google</strong> — OAuth sign-in
                provider
              </li>
            </ul>
            <p className="mt-2">
              Each of these services has its own privacy policy. We encourage you
              to review them.
            </p>
          </Section>

          <Section title="6. Cookies and Tracking">
            <p>
              We use essential cookies to maintain your authentication session.
              We also use analytics cookies (PostHog, Vercel Analytics) to
              understand usage patterns. You can disable non-essential cookies in
              your browser settings, though this may affect functionality.
            </p>
          </Section>

          <Section title="7. Data Retention and Deletion">
            <p>
              Your account data and submissions are retained as long as your
              account is active. You may request deletion of your account and all
              associated data at any time by contacting us. Upon deletion, your
              submissions are permanently removed from individual profile views,
              though they may still be reflected in aggregate statistics that
              cannot be attributed to you.
            </p>
          </Section>

          <Section title="8. Data Security">
            <p>
              We use industry-standard security measures including HTTPS
              encryption, Row Level Security on our database, rate limiting, and
              input sanitization. However, no method of electronic storage is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="9. Children&apos;s Privacy">
            <p>
              accepted.fyi is intended for high school and college-age students.
              We do not knowingly collect data from children under 13. If you
              believe a child under 13 has provided us with personal
              information, please contact us so we can delete it.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will
              notify users of material changes by posting a notice on the
              platform. Your continued use of accepted.fyi after changes are
              posted constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have questions about this Privacy Policy or want to request
              data deletion, contact us at:{" "}
              <a
                href="mailto:privacy@accepted.fyi"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                privacy@accepted.fyi
              </a>
            </p>
          </Section>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-slate-950 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Link
            href="/"
            className="text-sm font-bold text-slate-500 hover:text-slate-400"
          >
            accepted<span className="text-violet-500">.fyi</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/terms"
              className="text-sm text-slate-600 transition-colors hover:text-slate-400"
            >
              Terms of Service
            </Link>
            <span className="text-sm text-slate-600">&middot;</span>
            <span className="text-sm text-slate-600">
              Privacy Policy
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
