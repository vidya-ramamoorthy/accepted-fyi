import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getVisibleSubmissionById } from "@/lib/db/queries/submissions";
import { DECISION_COLORS, ROUND_LABELS } from "@/lib/constants/submission-labels";

export const revalidate = 1800;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) return {};

  const submission = await getVisibleSubmissionById(id);
  if (!submission) return {};

  const decisionLabel = DECISION_COLORS[submission.decision]?.label ?? submission.decision;
  const roundLabel = ROUND_LABELS[submission.applicationRound] ?? submission.applicationRound;
  const title = `${decisionLabel} — ${submission.schoolName} | accepted.fyi`;
  const description = `${decisionLabel} to ${submission.schoolName} (${submission.admissionCycle}, ${roundLabel}). See real admissions data on accepted.fyi.`;
  const baseUrl = getBaseUrl();
  const ogImageUrl = `${baseUrl}/api/og/card/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "accepted.fyi",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${decisionLabel} to ${submission.schoolName}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) notFound();

  const submission = await getVisibleSubmissionById(id);
  if (!submission) notFound();

  const decisionColors = DECISION_COLORS[submission.decision] ?? DECISION_COLORS.accepted;
  const roundLabel = ROUND_LABELS[submission.applicationRound] ?? submission.applicationRound;
  const baseUrl = getBaseUrl();
  const ogImageUrl = `${baseUrl}/api/og/card/${id}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-16">
      <div className="w-full max-w-2xl space-y-8">
        {/* Card preview */}
        <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-violet-500/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ogImageUrl}
            alt={`${decisionColors.label} to ${submission.schoolName}`}
            width={1200}
            height={630}
            className="w-full"
          />
        </div>

        {/* Info section */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">
            <span style={{ color: decisionColors.accent }}>{decisionColors.label}</span>
            {" "}to {submission.schoolName}
          </h1>
          <p className="mt-2 text-slate-400">
            {submission.admissionCycle} · {roundLabel}
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-block rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-xl"
          >
            Share Your Results on accepted.fyi
          </Link>
          <p className="mt-4 text-sm text-slate-500">
            See real admissions data from real students — GPA, test scores, and outcomes.
          </p>
        </div>
      </div>
    </div>
  );
}
