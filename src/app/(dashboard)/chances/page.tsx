"use client";

import { useState } from "react";
import { US_STATES } from "@/lib/constants/us-states";
import type {
  ChancesResponse,
  ChancesSchoolResult,
  ChancesClassification,
  ConfidenceLevel,
} from "@/lib/chances/types";

const inputClassName =
  "mt-1 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

const selectClassName =
  "mt-1 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

const CLASSIFICATION_CONFIG: Record<
  ChancesClassification,
  { label: string; borderColor: string; badgeColor: string; accentColor: string }
> = {
  safety: {
    label: "Safety Schools",
    borderColor: "border-emerald-500/30",
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    accentColor: "text-emerald-400",
  },
  match: {
    label: "Match Schools",
    borderColor: "border-amber-500/30",
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    accentColor: "text-amber-400",
  },
  reach: {
    label: "Reach Schools",
    borderColor: "border-violet-500/30",
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    accentColor: "text-violet-400",
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

const CONFIDENCE_DOTS: Record<ConfidenceLevel, { color: string; label: string }> = {
  high: { color: "bg-emerald-400", label: "High confidence" },
  medium: { color: "bg-amber-400", label: "Medium confidence" },
  low: { color: "bg-slate-500", label: "Low confidence" },
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

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-2xl font-bold text-white">Chances Calculator</h1>
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
              <h2 className="font-semibold text-white">Your Stats</h2>

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
                  <span className="ml-1 text-slate-500">(filters similar students)</span>
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
                    <span className="ml-1 text-slate-500">(filter)</span>
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
                    <span className="ml-1 text-slate-500">(optional)</span>
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
          </form>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {!hasResults && !isLoading && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-700 py-24">
              <div className="text-center">
                <p className="text-lg font-medium text-slate-400">
                  Enter your stats to see results
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  We'll compare your profile against institutional data and real student outcomes
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-700 py-24">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                <p className="mt-4 text-sm text-slate-400">
                  Analyzing {">"}1,000 schools...
                </p>
              </div>
            </div>
          )}

          {hasResults && !isLoading && (
            <div className="space-y-8">
              <p className="text-sm text-slate-500">
                {results.totalSchoolsEvaluated} schools evaluated &middot;{" "}
                {totalResultCount} with sufficient data
              </p>

              <ResultSection
                classification="safety"
                schools={results.safety}
              />
              <ResultSection
                classification="match"
                schools={results.match}
              />
              <ResultSection
                classification="reach"
                schools={results.reach}
              />
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
    <div>
      <div className="flex items-center gap-2">
        <h2 className={`text-lg font-semibold ${config.accentColor}`}>
          {config.label}
        </h2>
        <span className="text-sm text-slate-500">({schools.length})</span>
      </div>

      {schools.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          No {classification} schools found with your profile.
        </p>
      ) : (
        <div className="mt-3 space-y-3">
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
  const confidenceInfo = CONFIDENCE_DOTS[confidence];
  const acceptanceRateDisplay = school.acceptanceRate !== null
    ? `${school.acceptanceRate}%`
    : "N/A";
  const satRangeDisplay =
    school.sat25thPercentile !== null && school.sat75thPercentile !== null
      ? `${school.sat25thPercentile}-${school.sat75thPercentile}`
      : "N/A";

  return (
    <div className={`rounded-lg border ${config.borderColor} bg-slate-900/50 p-4`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-white">
              {school.name}
            </h3>
            <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.badgeColor}`}>
              {compositeScore}%
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {school.city}, {school.state}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" title={confidenceInfo.label}>
          <span className={`h-2 w-2 rounded-full ${confidenceInfo.color}`} />
          <span className="text-xs text-slate-500">{confidence}</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
        <span>Acceptance: {acceptanceRateDisplay}</span>
        <span>SAT: {satRangeDisplay}</span>
        {similarProfilesTotal > 0 && (
          <span className="font-medium text-slate-300">
            {similarProfilesAccepted} of {similarProfilesTotal} similar students accepted
          </span>
        )}
      </div>
    </div>
  );
}
