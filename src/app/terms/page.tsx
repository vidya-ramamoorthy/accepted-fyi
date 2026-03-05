import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms and conditions for using accepted.fyi, the crowdsourced college admissions data platform.",
  alternates: {
    canonical: "https://accepted.fyi/terms",
  },
};

export default function TermsOfServicePage() {
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
        <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: March 2, 2026
        </p>

        <div className="mt-12 space-y-10 text-slate-300 leading-relaxed">
          <Section title="1. Acceptance of Terms">
            <p>
              By accessing or using accepted.fyi (&quot;the Platform&quot;), you
              agree to be bound by these Terms of Service. If you do not agree,
              do not use the Platform.
            </p>
          </Section>

          <Section title="2. Eligibility">
            <p>
              To create an account, you must have a valid Google account. There
              is no minimum age requirement beyond Google&apos;s own account
              requirements, though the Platform is designed for high school and
              college-age students and their families.
            </p>
          </Section>

          <Section title="3. User Accounts">
            <p>
              You sign in using Google OAuth. You are responsible for maintaining
              the security of your Google account. You may not create multiple
              accounts to circumvent submission limits or data access
              restrictions.
            </p>
          </Section>

          <Section title="4. User-Submitted Data">
            <h4 className="mt-4 font-semibold text-white">Accuracy</h4>
            <p>
              You agree that all admissions data you submit is truthful and
              accurate to the best of your knowledge. Deliberately submitting
              false information (fake decisions, fabricated scores) violates
              these Terms and may result in account suspension.
            </p>

            <h4 className="mt-4 font-semibold text-white">
              One submission per school per cycle
            </h4>
            <p>
              You may submit one admissions result per school per admission
              cycle. If your decision changes (e.g., accepted off the waitlist),
              you may update your existing submission.
            </p>

            <h4 className="mt-4 font-semibold text-white">
              License to use your data
            </h4>
            <p>
              By submitting data, you grant accepted.fyi a non-exclusive,
              worldwide, royalty-free license to display, aggregate, and analyze
              your submission as part of the Platform. Your data is always
              displayed anonymously — your name and email are never shown to
              other users.
            </p>
          </Section>

          <Section title="5. Data Access Model">
            <p>
              accepted.fyi uses a &quot;submit to access&quot; model. Certain
              features — including viewing individual crowdsourced admission
              profiles — require you to submit at least one admissions result of
              your own. This model exists to ensure data quality and fairness:
              everyone who benefits from the data also contributes to it.
            </p>
          </Section>

          <Section title="6. Verification Tiers">
            <p>
              Submissions are classified into verification tiers:
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                <strong className="text-white">Bronze (Unverified):</strong>{" "}
                Self-reported data. Shown with an &quot;unverified&quot; label.
              </li>
              <li>
                <strong className="text-white">Silver (.edu Verified):</strong>{" "}
                User has verified a .edu email address from the school in their
                submission.
              </li>
              <li>
                <strong className="text-white">
                  Gold (Document Verified):
                </strong>{" "}
                Admission letter reviewed and confirmed by our verification
                system.
              </li>
            </ul>
            <p className="mt-2">
              Verification tiers are displayed alongside submissions so users
              can assess data reliability.
            </p>
          </Section>

          <Section title="7. Community Guidelines">
            <p>You agree not to:</p>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Submit intentionally false or misleading admissions data
              </li>
              <li>
                Create multiple accounts to game the system or bypass limits
              </li>
              <li>
                Scrape, crawl, or programmatically access the Platform without
                permission
              </li>
              <li>
                Harass, abuse, or target other users
              </li>
              <li>
                Attempt to de-anonymize other users&apos; submissions
              </li>
              <li>
                Use the Platform for any unlawful purpose
              </li>
            </ul>
            <p className="mt-2">
              Submissions may be flagged by the community. If a submission
              receives multiple flags, it may be temporarily hidden pending
              review.
            </p>
          </Section>

          <Section title="8. Publicly Sourced Data">
            <p>
              The Platform includes admissions data sourced from public sources
              such as Reddit (r/collegeresults), College Scorecard, and IPEDS.
              This data is clearly labeled with its source. We make reasonable
              efforts to parse and display this data accurately, but we do not
              guarantee the accuracy of publicly sourced information.
            </p>
          </Section>

          <Section title="9. Intellectual Property">
            <p>
              The accepted.fyi name, logo, design, and original content are
              owned by us. You retain ownership of the factual data you submit
              (your GPA, scores, and decisions are facts about you). The
              aggregated dataset, visualizations, and platform features are our
              intellectual property.
            </p>
          </Section>

          <Section title="10. Disclaimers">
            <p>
              The Platform is provided &quot;as is&quot; without warranties of
              any kind. We do not guarantee the accuracy, completeness, or
              reliability of any admissions data on the Platform, whether
              user-submitted or publicly sourced.
            </p>
            <p>
              accepted.fyi is not an admissions consulting service. Data on the
              Platform should not be your sole basis for college application
              decisions.
            </p>
          </Section>

          <Section title="11. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, accepted.fyi and its
              operators shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages arising from your use
              of the Platform, including but not limited to decisions made based
              on data displayed on the Platform.
            </p>
          </Section>

          <Section title="12. Account Termination">
            <p>
              We reserve the right to suspend or terminate accounts that violate
              these Terms, submit fraudulent data, or abuse the Platform. You
              may also delete your account at any time by contacting us.
            </p>
          </Section>

          <Section title="13. Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will notify users
              of material changes by posting a notice on the Platform. Your
              continued use of accepted.fyi after changes are posted constitutes
              acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="14. Contact Us">
            <p>
              If you have questions about these Terms, contact us at:{" "}
              <a
                href="mailto:legal@accepted.fyi"
                className="text-violet-400 underline underline-offset-2 hover:text-violet-300"
              >
                legal@accepted.fyi
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
            <span className="text-sm text-slate-600">
              Terms of Service
            </span>
            <span className="text-sm text-slate-600">&middot;</span>
            <Link
              href="/privacy"
              className="text-sm text-slate-600 transition-colors hover:text-slate-400"
            >
              Privacy Policy
            </Link>
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
