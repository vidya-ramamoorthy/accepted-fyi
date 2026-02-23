"use client";

import { useState, useRef } from "react";
import { US_STATES } from "@/lib/constants/us-states";
import Link from "next/link";
import type {
  ChancesResponse,
  ChancesSchoolResult,
  ChancesClassification,
  ConfidenceLevel,
} from "@/lib/chances/types";

const inputClassName =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

const selectClassName =
  "mt-1 w-full rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

const CLASSIFICATION_CONFIG: Record<
  ChancesClassification,
  {
    label: string;
    description: string;
    borderColor: string;
    badgeColor: string;
    accentColor: string;
    bgAccent: string;
    scoreRange: string;
  }
> = {
  safety: {
    label: "Safety Schools",
    description: "Strong chance of acceptance based on your profile",
    borderColor: "border-emerald-500/30",
    badgeColor: "bg-emerald-500/15 text-emerald-400",
    accentColor: "text-emerald-400",
    bgAccent: "bg-emerald-500/10",
    scoreRange: "70-100",
  },
  match: {
    label: "Match Schools",
    description: "Competitive profile — outcome could go either way",
    borderColor: "border-amber-500/30",
    badgeColor: "bg-amber-500/15 text-amber-400",
    accentColor: "text-amber-400",
    bgAccent: "bg-amber-500/10",
    scoreRange: "40-69",
  },
  reach: {
    label: "Reach Schools",
    description: "Highly selective — acceptance is not guaranteed",
    borderColor: "border-violet-500/30",
    badgeColor: "bg-violet-500/15 text-violet-400",
    accentColor: "text-violet-400",
    bgAccent: "bg-violet-500/10",
    scoreRange: "0-39",
  },
};

const ADMISSION_CYCLES = [
  { value: "", label: "All cycles" },
  { value: "2025-2026", label: "2025-2026" },
  { value: "2024-2025", label: "2024-2025" },
  { value: "2023-2024", label: "2023-2024" },
  { value: "2022-2023", label: "2022-2023" },
  { value: "2021-2022", label: "2021-2022" },
];

const CONFIDENCE_CONFIG: Record<ConfidenceLevel, { color: string; bgColor: string; label: string }> = {
  high: { color: "text-emerald-400", bgColor: "bg-emerald-400", label: "High" },
  medium: { color: "text-amber-400", bgColor: "bg-amber-400", label: "Medium" },
  low: { color: "text-slate-400", bgColor: "bg-slate-500", label: "Low" },
};

export default function ChancesPage() {
  const [gpaUnweighted, setGpaUnweighted] = useState("");
  const [satScore, setSatScore] = useState("");
  const [actScore, setActScore] = useState("");
  const [stateOfResidence, setStateOfResidence] = useState("");
  const [intendedMajor, setIntendedMajor] = useState("");
  const [apCoursesCount, setApCoursesCount] = useState("");
  const [admissionCycle, setAdmissionCycle] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [results, setResults] = useState<ChancesResponse | null>(null);

  const safetyRef = useRef<HTMLDivElement>(null);
  const matchRef = useRef<HTMLDivElement>(null);
  const reachRef = useRef<HTMLDivElement>(null);

  const sectionRefs: Record<ChancesClassification, React.RefObject<HTMLDivElement | null>> = {
    safety: safetyRef,
    match: matchRef,
    reach: reachRef,
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const params = new URLSearchParams();
    if (gpaUnweighted) params.set("gpa", gpaUnweighted);
    if (satScore) params.set("sat", satScore);
    if (actScore) params.set("act", actScore);
    if (stateOfResidence) params.set("state", stateOfResidence);
    if (intendedMajor) params.set("major", intendedMajor);
    if (apCoursesCount) params.set("ap", apCoursesCount);
    if (admissionCycle) params.set("cycle", admissionCycle);

    try {
      const response = await fetch(`/api/chances?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        const errorDetails = errorData.details
          ?.map((detail: { message: string }) => detail.message)
          .join(". ");
        setErrorMessage(errorDetails || errorData.error || "Failed to calculate. Please try again.");
        setResults(null);
        return;
      }

      const data: ChancesResponse = await response.json();
      setResults(data);
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  };

  const hasResults = results !== null;
  const totalResultCount = hasResults
    ? results.safety.length + results.match.length + results.reach.length
    : 0;

  const scrollToSection = (classification: ChancesClassification) => {
    sectionRefs[classification].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold text-white">Chances Calculator</h1>
      <p className="mt-2 text-slate-400">
        Enter your stats to see which schools are a reach, match, or safety for you.
      </p>

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Form Panel */}
        <div>
          <form onSubmit={handleSubmit} className="sticky top-28">
            <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">Your Stats</h2>

              <div>
                <label htmlFor="gpaUnweighted" className="block text-sm font-medium text-slate-300">
                  GPA (Unweighted)
                </label>
                <input
                  id="gpaUnweighted"
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={gpaUnweighted}
                  onChange={(event) => setGpaUnweighted(event.target.value)}
                  placeholder="e.g., 3.85"
                  className={inputClassName}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="satScore" className="block text-sm font-medium text-slate-300">
                    SAT Score
                  </label>
                  <input
                    id="satScore"
                    type="number"
                    min="400"
                    max="1600"
                    value={satScore}
                    onChange={(event) => setSatScore(event.target.value)}
                    placeholder="e.g., 1520"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="actScore" className="block text-sm font-medium text-slate-300">
                    ACT Score
                  </label>
                  <input
                    id="actScore"
                    type="number"
                    min="1"
                    max="36"
                    value={actScore}
                    onChange={(event) => setActScore(event.target.value)}
                    placeholder="e.g., 34"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="stateOfResidence" className="block text-sm font-medium text-slate-300">
                  State of Residence
                </label>
                <select
                  id="stateOfResidence"
                  value={stateOfResidence}
                  onChange={(event) => setStateOfResidence(event.target.value)}
                  required
                  className={selectClassName}
                >
                  <option value="">Select state</option>
                  {US_STATES.map((state) => (
                    <option key={state.abbreviation} value={state.abbreviation}>
                      {state.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="intendedMajor" className="block text-sm font-medium text-slate-300">
                  Intended Major
                  <span className="ml-1 text-slate-500">(optional)</span>
                </label>
                <input
                  id="intendedMajor"
                  type="text"
                  value={intendedMajor}
                  onChange={(event) => setIntendedMajor(event.target.value)}
                  placeholder="e.g., Computer Science"
                  className={inputClassName}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="admissionCycle" className="block text-sm font-medium text-slate-300">
                    Cycle Year
                  </label>
                  <select
                    id="admissionCycle"
                    value={admissionCycle}
                    onChange={(event) => setAdmissionCycle(event.target.value)}
                    className={selectClassName}
                  >
                    {ADMISSION_CYCLES.map((cycle) => (
                      <option key={cycle.value} value={cycle.value}>
                        {cycle.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="apCoursesCount" className="block text-sm font-medium text-slate-300">
                    AP/IB Courses
                  </label>
                  <input
                    id="apCoursesCount"
                    type="number"
                    min="0"
                    max="30"
                    value={apCoursesCount}
                    onChange={(event) => setApCoursesCount(event.target.value)}
                    placeholder="e.g., 8"
                    className={inputClassName}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-xl hover:shadow-violet-600/30 disabled:opacity-50"
              >
                {isLoading ? "Calculating..." : "Calculate My Chances"}
              </button>
            </div>

            {/* How it works — below form */}
            <div className="mt-4 rounded-xl border border-white/5 bg-slate-900/30 p-5">
              <h3 className="text-sm font-medium text-slate-300">How it works</h3>
              <ul className="mt-3 space-y-2 text-xs text-slate-500">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  <span>Compares your stats against official school data (College Scorecard, Common Data Set)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  <span>Finds students with similar profiles in our crowdsourced database</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                  <span>Blends both data sources (60% institutional, 40% crowdsourced) for a composite score</span>
                </li>
              </ul>
            </div>
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {!hasResults && !isLoading && (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-700/50 py-32">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/50">
                  <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-slate-300">
                  Enter your stats to see results
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                  We&apos;ll compare your profile against institutional data and real student outcomes across 1,000+ schools
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-slate-700/50 py-32">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                <p className="mt-5 text-sm font-medium text-slate-300">
                  Analyzing 1,000+ schools...
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  This usually takes a few seconds
                </p>
              </div>
            </div>
          )}

          {hasResults && !isLoading && (
            <div className="space-y-6">
              {/* Summary bar */}
              <div className="rounded-xl border border-white/5 bg-slate-900/50 p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-400">
                    <span className="font-medium text-white">{totalResultCount}</span> schools matched from{" "}
                    <span className="text-slate-300">{results.totalSchoolsEvaluated}</span> evaluated
                  </p>
                </div>

                {/* Category quick-jump pills */}
                <div className="mt-4 flex flex-wrap gap-3">
                  {(["safety", "match", "reach"] as ChancesClassification[]).map((classification) => {
                    const config = CLASSIFICATION_CONFIG[classification];
                    const count =
                      classification === "safety"
                        ? results.safety.length
                        : classification === "match"
                          ? results.match.length
                          : results.reach.length;
                    return (
                      <button
                        key={classification}
                        onClick={() => scrollToSection(classification)}
                        className={`flex items-center gap-2 rounded-lg border ${config.borderColor} ${config.bgAccent} px-4 py-2.5 transition-all hover:brightness-125`}
                      >
                        <span className={`text-sm font-semibold ${config.accentColor}`}>
                          {config.label}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${config.badgeColor}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sections */}
              <div ref={safetyRef} className="scroll-mt-28">
                <ResultSection classification="safety" schools={results.safety} />
              </div>
              <div ref={matchRef} className="scroll-mt-28">
                <ResultSection classification="match" schools={results.match} />
              </div>
              <div ref={reachRef} className="scroll-mt-28">
                <ResultSection classification="reach" schools={results.reach} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ResultSection({
  classification,
  schools,
}: {
  classification: ChancesClassification;
  schools: ChancesSchoolResult[];
}) {
  const config = CLASSIFICATION_CONFIG[classification];

  return (
    <div className={`rounded-xl border ${config.borderColor} bg-slate-900/30 p-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-bold ${config.accentColor}`}>
            {config.label}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{config.description}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${config.badgeColor}`}>
          {schools.length}
        </span>
      </div>

      {schools.length === 0 ? (
        <p className="mt-6 text-center text-sm text-slate-500">
          No {classification} schools found with your profile.
        </p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {schools.map((result) => (
            <SchoolCard
              key={result.school.id}
              result={result}
              config={config}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SchoolCard({
  result,
  config,
}: {
  result: ChancesSchoolResult;
  config: (typeof CLASSIFICATION_CONFIG)[ChancesClassification];
}) {
  const { school, compositeScore, confidence, similarProfilesTotal, similarProfilesAccepted } = result;
  const confidenceInfo = CONFIDENCE_CONFIG[confidence];
  const acceptanceRateDisplay = school.acceptanceRate !== null
    ? `${school.acceptanceRate}%`
    : "N/A";
  const satRangeDisplay =
    school.sat25thPercentile !== null && school.sat75thPercentile !== null
      ? `${school.sat25thPercentile}-${school.sat75thPercentile}`
      : "N/A";

  return (
    <Link
      href={`/schools/${school.slug ?? school.id}`}
      className={`group block rounded-xl border ${config.borderColor} bg-slate-900/60 p-5 transition-all hover:bg-slate-900/80 hover:shadow-lg`}
    >
      {/* Header: School name + Score */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors">
            {school.name}
          </h3>
          <p className="mt-0.5 text-sm text-slate-500">
            {school.city}, {school.state}
          </p>
        </div>
        <div className="flex flex-col items-center shrink-0">
          <span className={`text-2xl font-bold ${config.accentColor}`}>
            {Math.round(compositeScore)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-500">score</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-slate-800/50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Accept</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{acceptanceRateDisplay}</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">SAT Range</p>
          <p className="mt-0.5 text-sm font-semibold text-white">{satRangeDisplay}</p>
        </div>
        <div className="rounded-lg bg-slate-800/50 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-slate-500">Confidence</p>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${confidenceInfo.bgColor}`} />
            <span className={`text-sm font-medium ${confidenceInfo.color}`}>{confidenceInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Similar profiles */}
      {similarProfilesTotal > 0 && (
        <div className="mt-3 rounded-lg bg-slate-800/30 px-3 py-2">
          <p className="text-xs text-slate-400">
            <span className="font-semibold text-white">{similarProfilesAccepted}</span> of{" "}
            <span className="font-semibold text-white">{similarProfilesTotal}</span> similar students were accepted
          </p>
        </div>
      )}
    </Link>
  );
}
