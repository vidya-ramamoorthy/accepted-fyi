"use client";

import { useState } from "react";
import Link from "next/link";
import SchoolAutocomplete from "@/components/SchoolAutocomplete";
import StateAutocomplete from "@/components/submissions/StateAutocomplete";
import MajorAutocomplete from "@/components/MajorAutocomplete";
import ShareCardButton from "@/components/cards/ShareCardButton";
import type { AdmissionDecision } from "@/types/database";

const APPLICATION_ROUNDS = [
  { value: "early_decision", label: "Early Decision" },
  { value: "early_action", label: "Early Action" },
  { value: "regular", label: "Regular Decision" },
  { value: "rolling", label: "Rolling Admission" },
];

const DECISIONS: { value: AdmissionDecision; label: string }[] = [
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "deferred", label: "Deferred" },
];

const HIGH_SCHOOL_TYPES = [
  { value: "", label: "Select (optional)" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "charter", label: "Charter" },
  { value: "magnet", label: "Magnet" },
  { value: "homeschool", label: "Homeschool" },
  { value: "international", label: "International" },
];

const GEOGRAPHIC_OPTIONS = [
  { value: "", label: "Select (optional)" },
  { value: "rural", label: "Rural" },
  { value: "suburban", label: "Suburban" },
  { value: "urban", label: "Urban" },
];

const SCHOLARSHIP_OPTIONS = [
  { value: "", label: "Select (optional)" },
  { value: "none", label: "None" },
  { value: "merit", label: "Merit-Based" },
  { value: "need_based", label: "Need-Based" },
  { value: "both", label: "Both Merit & Need" },
];

const ATTENDANCE_OPTIONS = [
  { value: "", label: "Select (optional)" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "undecided", label: "Undecided" },
];

const WAITLIST_OUTCOME_OPTIONS = [
  { value: "", label: "Select (optional)" },
  { value: "accepted_off_waitlist", label: "Accepted Off Waitlist" },
  { value: "rejected_off_waitlist", label: "Rejected Off Waitlist" },
  { value: "withdrew", label: "Withdrew" },
];

const selectClassName =
  "mt-1 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-3 text-sm text-slate-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

const inputClassName =
  "mt-1 w-full rounded-md border border-slate-700 bg-slate-800/50 px-3 py-3 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

export default function SubmitPage() {
  const [formLoadedAt] = useState(() => Date.now());
  const [honeypotValue, setHoneypotValue] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [schoolState, setSchoolState] = useState("");
  const [schoolCity, setSchoolCity] = useState("");
  const [decision, setDecision] = useState<AdmissionDecision>("accepted");
  const [applicationRound, setApplicationRound] = useState("regular");
  const [gpaUnweighted, setGpaUnweighted] = useState("");
  const [gpaWeighted, setGpaWeighted] = useState("");
  const [satScore, setSatScore] = useState("");
  const [actScore, setActScore] = useState("");
  const [intendedMajor, setIntendedMajor] = useState("");
  const [stateOfResidence, setStateOfResidence] = useState("");
  const [extracurriculars, setExtracurriculars] = useState("");
  const [admissionCycle, setAdmissionCycle] = useState("2025-2026");
  const [highSchoolType, setHighSchoolType] = useState("");
  const [firstGeneration, setFirstGeneration] = useState<boolean | undefined>(undefined);
  const [legacyStatus, setLegacyStatus] = useState<boolean | undefined>(undefined);
  const [financialAidApplied, setFinancialAidApplied] = useState<boolean | undefined>(undefined);
  const [geographicClassification, setGeographicClassification] = useState("");
  const [apCoursesCount, setApCoursesCount] = useState("");
  const [ibCoursesCount, setIbCoursesCount] = useState("");
  const [honorsCoursesCount, setHonorsCoursesCount] = useState("");
  const [scholarshipOffered, setScholarshipOffered] = useState("");
  const [willAttend, setWillAttend] = useState("");
  const [waitlistOutcome, setWaitlistOutcome] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [submittedSubmissionId, setSubmittedSubmissionId] = useState<string | null>(null);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const showWaitlistOutcome = decision === "waitlisted";

  const inputClass = (field: string) =>
    fieldErrors[field]
      ? inputClassName.replace("border-slate-700", "border-red-500")
      : inputClassName;

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!schoolName || schoolName.trim().length < 2) {
      errors.schoolName = "School name is required (at least 2 characters)";
    }

    if (!stateOfResidence || stateOfResidence.trim().length === 0) {
      errors.stateOfResidence = "State of residence is required";
    }

    const cyclePattern = /^\d{4}-\d{4}$/;
    if (!admissionCycle || !cyclePattern.test(admissionCycle)) {
      errors.admissionCycle = "Admission cycle must be in YYYY-YYYY format";
    }

    if (gpaUnweighted) {
      const gpa = parseFloat(gpaUnweighted);
      if (isNaN(gpa) || gpa < 0 || gpa > 4.0) {
        errors.gpaUnweighted = "GPA must be between 0 and 4.0";
      }
    }

    if (gpaWeighted) {
      const gpa = parseFloat(gpaWeighted);
      if (isNaN(gpa) || gpa < 0 || gpa > 5.0) {
        errors.gpaWeighted = "Weighted GPA must be between 0 and 5.0";
      }
    }

    if (satScore) {
      const sat = parseInt(satScore, 10);
      if (isNaN(sat) || sat < 400 || sat > 1600) {
        errors.satScore = "SAT score must be between 400 and 1600";
      }
    }

    if (actScore) {
      const act = parseInt(actScore, 10);
      if (isNaN(act) || act < 1 || act > 36) {
        errors.actScore = "ACT score must be between 1 and 36";
      }
    }

    if (apCoursesCount) {
      const count = parseInt(apCoursesCount, 10);
      if (isNaN(count) || count < 0 || count > 30) {
        errors.apCoursesCount = "AP courses must be between 0 and 30";
      }
    }

    if (ibCoursesCount) {
      const count = parseInt(ibCoursesCount, 10);
      if (isNaN(count) || count < 0 || count > 30) {
        errors.ibCoursesCount = "IB courses must be between 0 and 30";
      }
    }

    if (honorsCoursesCount) {
      const count = parseInt(honorsCoursesCount, 10);
      if (isNaN(count) || count < 0 || count > 30) {
        errors.honorsCoursesCount = "Honors courses must be between 0 and 30";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName,
          schoolState: schoolState || undefined,
          schoolCity: schoolCity || undefined,
          _formLoadedAt: formLoadedAt,
          _website: honeypotValue,
          decision,
          applicationRound,
          gpaUnweighted: gpaUnweighted || undefined,
          gpaWeighted: gpaWeighted || undefined,
          satScore: satScore || undefined,
          actScore: actScore || undefined,
          intendedMajor: intendedMajor || undefined,
          stateOfResidence,
          extracurriculars: extracurriculars
            .split(",")
            .map((ec) => ec.trim())
            .filter((ec) => ec.length > 0),
          admissionCycle,
          highSchoolType: highSchoolType || undefined,
          firstGeneration,
          legacyStatus,
          financialAidApplied,
          geographicClassification: geographicClassification || undefined,
          apCoursesCount: apCoursesCount || undefined,
          ibCoursesCount: ibCoursesCount || undefined,
          honorsCoursesCount: honorsCoursesCount || undefined,
          scholarshipOffered: scholarshipOffered || undefined,
          willAttend: willAttend || undefined,
          waitlistOutcome: (showWaitlistOutcome && waitlistOutcome) || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorDetails = errorData.details
          ?.map((detail: { message: string }) => detail.message)
          .join(". ");
        setErrorMessage(errorDetails || errorData.error || "Failed to submit. Please try again.");
        return;
      }

      const responseData = await response.json();
      setSubmittedSubmissionId(responseData.submission?.id ?? null);
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedSubmissionId) {
    return (
      <PostSubmissionSharePrompt
        submissionId={submittedSubmissionId}
        schoolName={schoolName}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-white">
        Submit Your Admission Result
      </h1>
      <p className="mt-2 text-slate-400">
        Share your results to help others make data-driven college decisions.
      </p>

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-6">
        {/* Honeypot — invisible to humans, filled by bots */}
        <div aria-hidden="true" className="absolute left-[-9999px] h-0 overflow-hidden">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypotValue}
            onChange={(event) => setHoneypotValue(event.target.value)}
          />
        </div>

        {/* School & Decision — Core Fields */}
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6 space-y-4">
          <h2 className="font-semibold text-white">School &amp; Decision</h2>

          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-slate-300">
              School Name
            </label>
            <SchoolAutocomplete
              id="schoolName"
              value={schoolName}
              onSelect={(name, state, city) => {
                setSchoolName(name);
                if (state) setSchoolState(state);
                if (city) setSchoolCity(city);
              }}
              required
              className={inputClass("schoolName")}
            />
            <FieldError message={fieldErrors.schoolName} />
            <p className="mt-1 text-xs text-slate-500">
              Start typing to see suggestions, or enter any school name
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="decision" className="block text-sm font-medium text-slate-300">
                Decision
              </label>
              <select
                id="decision"
                value={decision}
                onChange={(event) => setDecision(event.target.value as AdmissionDecision)}
                className={selectClassName}
              >
                {DECISIONS.map((decisionOption) => (
                  <option key={decisionOption.value} value={decisionOption.value}>
                    {decisionOption.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="applicationRound" className="block text-sm font-medium text-slate-300">
                Application Round
              </label>
              <select
                id="applicationRound"
                value={applicationRound}
                onChange={(event) => setApplicationRound(event.target.value)}
                className={selectClassName}
              >
                {APPLICATION_ROUNDS.map((round) => (
                  <option key={round.value} value={round.value}>
                    {round.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="admissionCycle" className="block text-sm font-medium text-slate-300">
                Admission Cycle
              </label>
              <input
                id="admissionCycle"
                type="text"
                required
                value={admissionCycle}
                onChange={(event) => setAdmissionCycle(event.target.value)}
                placeholder="e.g., 2025-2026"
                className={inputClass("admissionCycle")}
              />
              <FieldError message={fieldErrors.admissionCycle} />
            </div>
            <div>
              <label htmlFor="stateOfResidence" className="block text-sm font-medium text-slate-300">
                State of Residence
              </label>
              <StateAutocomplete
                id="stateOfResidence"
                value={stateOfResidence}
                onSelect={(abbreviation) => setStateOfResidence(abbreviation)}
                className={`${inputClass("stateOfResidence")} uppercase`}
              />
              <FieldError message={fieldErrors.stateOfResidence} />
            </div>
          </div>

          {showWaitlistOutcome && (
            <div>
              <label htmlFor="waitlistOutcome" className="block text-sm font-medium text-slate-300">
                Waitlist Outcome
              </label>
              <select
                id="waitlistOutcome"
                value={waitlistOutcome}
                onChange={(event) => setWaitlistOutcome(event.target.value)}
                className={selectClassName}
              >
                {WAITLIST_OUTCOME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Your Stats — Core Fields */}
        <div className="rounded-xl border border-white/5 bg-slate-900/50 p-6 space-y-4">
          <h2 className="font-semibold text-white">Your Stats</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                className={inputClass("gpaUnweighted")}
              />
              <FieldError message={fieldErrors.gpaUnweighted} />
            </div>
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
                className={inputClass("satScore")}
              />
              <FieldError message={fieldErrors.satScore} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="intendedMajor" className="block text-sm font-medium text-slate-300">
                Intended Major
              </label>
              <MajorAutocomplete
                id="intendedMajor"
                value={intendedMajor}
                onSelect={(major) => setIntendedMajor(major)}
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
                className={inputClass("actScore")}
              />
              <FieldError message={fieldErrors.actScore} />
            </div>
          </div>
        </div>

        {/* Optional Details — Collapsible */}
        <div className="rounded-xl border border-white/5 bg-slate-900/50">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <div>
              <h2 className="font-semibold text-white">More Details</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Optional — more context helps others compare results
              </p>
            </div>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform ${showOptionalFields ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {showOptionalFields && (
            <div className="space-y-4 border-t border-white/5 px-6 pb-6 pt-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="gpaWeighted" className="block text-sm font-medium text-slate-300">
                    GPA (Weighted)
                  </label>
                  <input
                    id="gpaWeighted"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5.0"
                    value={gpaWeighted}
                    onChange={(event) => setGpaWeighted(event.target.value)}
                    placeholder="e.g., 4.32"
                    className={inputClass("gpaWeighted")}
                  />
                  <FieldError message={fieldErrors.gpaWeighted} />
                </div>
                <div>
                  <label htmlFor="highSchoolType" className="block text-sm font-medium text-slate-300">
                    High School Type
                  </label>
                  <select
                    id="highSchoolType"
                    value={highSchoolType}
                    onChange={(event) => setHighSchoolType(event.target.value)}
                    className={selectClassName}
                  >
                    {HIGH_SCHOOL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="apCoursesCount" className="block text-sm font-medium text-slate-300">
                    AP Courses
                  </label>
                  <input
                    id="apCoursesCount"
                    type="number"
                    min="0"
                    max="30"
                    value={apCoursesCount}
                    onChange={(event) => setApCoursesCount(event.target.value)}
                    placeholder="e.g., 8"
                    className={inputClass("apCoursesCount")}
                  />
                  <FieldError message={fieldErrors.apCoursesCount} />
                </div>
                <div>
                  <label htmlFor="ibCoursesCount" className="block text-sm font-medium text-slate-300">
                    IB Courses
                  </label>
                  <input
                    id="ibCoursesCount"
                    type="number"
                    min="0"
                    max="30"
                    value={ibCoursesCount}
                    onChange={(event) => setIbCoursesCount(event.target.value)}
                    placeholder="e.g., 6"
                    className={inputClass("ibCoursesCount")}
                  />
                  <FieldError message={fieldErrors.ibCoursesCount} />
                </div>
                <div>
                  <label htmlFor="honorsCoursesCount" className="block text-sm font-medium text-slate-300">
                    Honors Courses
                  </label>
                  <input
                    id="honorsCoursesCount"
                    type="number"
                    min="0"
                    max="30"
                    value={honorsCoursesCount}
                    onChange={(event) => setHonorsCoursesCount(event.target.value)}
                    placeholder="e.g., 4"
                    className={inputClass("honorsCoursesCount")}
                  />
                  <FieldError message={fieldErrors.honorsCoursesCount} />
                </div>
              </div>

              <div>
                <label htmlFor="geographicClassification" className="block text-sm font-medium text-slate-300">
                  Area Type
                </label>
                <select
                  id="geographicClassification"
                  value={geographicClassification}
                  onChange={(event) => setGeographicClassification(event.target.value)}
                  className={selectClassName}
                >
                  {GEOGRAPHIC_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    First-Generation
                  </label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="firstGeneration"
                        checked={firstGeneration === true}
                        onChange={() => setFirstGeneration(true)}
                        className="text-violet-600"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="firstGeneration"
                        checked={firstGeneration === false}
                        onChange={() => setFirstGeneration(false)}
                        className="text-violet-600"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Legacy
                  </label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="legacyStatus"
                        checked={legacyStatus === true}
                        onChange={() => setLegacyStatus(true)}
                        className="text-violet-600"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="legacyStatus"
                        checked={legacyStatus === false}
                        onChange={() => setLegacyStatus(false)}
                        className="text-violet-600"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">
                    Financial Aid
                  </label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="financialAidApplied"
                        checked={financialAidApplied === true}
                        onChange={() => setFinancialAidApplied(true)}
                        className="text-violet-600"
                      />
                      Yes
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="financialAidApplied"
                        checked={financialAidApplied === false}
                        onChange={() => setFinancialAidApplied(false)}
                        className="text-violet-600"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="extracurriculars" className="block text-sm font-medium text-slate-300">
                  Extracurriculars (comma-separated)
                </label>
                <textarea
                  id="extracurriculars"
                  rows={3}
                  value={extracurriculars}
                  onChange={(event) => setExtracurriculars(event.target.value)}
                  placeholder="e.g., Debate Team Captain, Math Olympiad, Volunteer at Food Bank"
                  className={inputClassName}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="scholarshipOffered" className="block text-sm font-medium text-slate-300">
                    Scholarship Offered
                  </label>
                  <select
                    id="scholarshipOffered"
                    value={scholarshipOffered}
                    onChange={(event) => setScholarshipOffered(event.target.value)}
                    className={selectClassName}
                  >
                    {SCHOLARSHIP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="willAttend" className="block text-sm font-medium text-slate-300">
                    Will You Attend?
                  </label>
                  <select
                    id="willAttend"
                    value={willAttend}
                    onChange={(event) => setWillAttend(event.target.value)}
                    className={selectClassName}
                  >
                    {ATTENDANCE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:shadow-xl hover:shadow-violet-600/30 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Your Result"}
        </button>
      </form>
    </div>
  );
}

function PostSubmissionSharePrompt({
  submissionId,
  schoolName,
}: {
  submissionId: string;
  schoolName: string;
}) {
  const cardImageUrl = `/api/og/card/${submissionId}`;

  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-4">
        <p className="font-semibold text-emerald-400">
          Your result has been submitted!
        </p>
      </div>

      <h2 className="mt-8 text-2xl font-bold text-white">
        Share Your Result
      </h2>
      <p className="mt-2 text-slate-400">
        Download your decision card to share on Instagram, TikTok, or Twitter.
      </p>

      {/* Card preview */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-violet-500/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cardImageUrl}
          alt={`Decision card for ${schoolName}`}
          width={1200}
          height={630}
          className="w-full"
        />
      </div>

      {/* Share actions */}
      <div className="mt-6 flex items-center justify-center">
        <ShareCardButton submissionId={submissionId} schoolName={schoolName} />
      </div>

      {/* Continue link */}
      <Link
        href="/browse"
        className="mt-8 inline-block text-sm text-slate-400 underline underline-offset-4 transition-colors hover:text-white"
      >
        Continue to Browse
      </Link>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-400">{message}</p>;
}
