"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SchoolAutocomplete from "@/components/SchoolAutocomplete";
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
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const inputClassName =
  "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function SubmitPage() {
  const router = useRouter();
  const [schoolName, setSchoolName] = useState("");
  const [schoolState, setSchoolState] = useState("");
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
  const [scholarshipOffered, setScholarshipOffered] = useState("");
  const [willAttend, setWillAttend] = useState("");
  const [waitlistOutcome, setWaitlistOutcome] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const REDIRECT_DELAY_MS = 1500;

  const showWaitlistOutcome = decision === "waitlisted";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName,
          schoolState: schoolState || undefined,
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

      setSuccessMessage("Your result has been submitted! Redirecting to browse...");
      setTimeout(() => {
        router.push("/browse");
        router.refresh();
      }, REDIRECT_DELAY_MS);
    } catch {
      setErrorMessage("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">
        Submit Your Admission Result
      </h1>
      <p className="mt-2 text-gray-600">
        Share your results to unlock access to everyone else&apos;s data.
      </p>

      {errorMessage && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* School & Decision */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">School &amp; Decision</h2>

          <div>
            <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700">
              School Name
            </label>
            <SchoolAutocomplete
              id="schoolName"
              value={schoolName}
              onSelect={(name, state) => {
                setSchoolName(name);
                if (state) setSchoolState(state);
              }}
              required
              className={inputClassName}
            />
            <p className="mt-1 text-xs text-gray-500">
              Start typing to see suggestions, or enter any school name
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="decision" className="block text-sm font-medium text-gray-700">
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
              <label htmlFor="applicationRound" className="block text-sm font-medium text-gray-700">
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

          <div>
            <label htmlFor="admissionCycle" className="block text-sm font-medium text-gray-700">
              Admission Cycle
            </label>
            <input
              id="admissionCycle"
              type="text"
              required
              value={admissionCycle}
              onChange={(event) => setAdmissionCycle(event.target.value)}
              placeholder="e.g., 2025-2026"
              className={inputClassName}
            />
          </div>

          {showWaitlistOutcome && (
            <div>
              <label htmlFor="waitlistOutcome" className="block text-sm font-medium text-gray-700">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="scholarshipOffered" className="block text-sm font-medium text-gray-700">
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
              <label htmlFor="willAttend" className="block text-sm font-medium text-gray-700">
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

        {/* Your Stats */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Your Stats</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="gpaUnweighted" className="block text-sm font-medium text-gray-700">
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
            <div>
              <label htmlFor="gpaWeighted" className="block text-sm font-medium text-gray-700">
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
                className={inputClassName}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="satScore" className="block text-sm font-medium text-gray-700">
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
              <label htmlFor="actScore" className="block text-sm font-medium text-gray-700">
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="intendedMajor" className="block text-sm font-medium text-gray-700">
                Intended Major
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
            <div>
              <label htmlFor="apCoursesCount" className="block text-sm font-medium text-gray-700">
                Number of AP/IB Courses
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
        </div>

        {/* Your Background */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Your Background</h2>
          <p className="text-xs text-gray-500">
            All fields in this section are optional. More context helps others compare results.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="stateOfResidence" className="block text-sm font-medium text-gray-700">
                State of Residence
              </label>
              <input
                id="stateOfResidence"
                type="text"
                required
                maxLength={2}
                value={stateOfResidence}
                onChange={(event) => setStateOfResidence(event.target.value.toUpperCase())}
                placeholder="e.g., CA"
                className={`${inputClassName} uppercase`}
              />
            </div>
            <div>
              <label htmlFor="geographicClassification" className="block text-sm font-medium text-gray-700">
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="highSchoolType" className="block text-sm font-medium text-gray-700">
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
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First-Generation Student
              </label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="firstGeneration"
                    checked={firstGeneration === true}
                    onChange={() => setFirstGeneration(true)}
                    className="text-blue-600"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="firstGeneration"
                    checked={firstGeneration === false}
                    onChange={() => setFirstGeneration(false)}
                    className="text-blue-600"
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Legacy at This School
              </label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="legacyStatus"
                    checked={legacyStatus === true}
                    onChange={() => setLegacyStatus(true)}
                    className="text-blue-600"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="legacyStatus"
                    checked={legacyStatus === false}
                    onChange={() => setLegacyStatus(false)}
                    className="text-blue-600"
                  />
                  No
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Applied for Financial Aid
              </label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="financialAidApplied"
                    checked={financialAidApplied === true}
                    onChange={() => setFinancialAidApplied(true)}
                    className="text-blue-600"
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="financialAidApplied"
                    checked={financialAidApplied === false}
                    onChange={() => setFinancialAidApplied(false)}
                    className="text-blue-600"
                  />
                  No
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="extracurriculars" className="block text-sm font-medium text-gray-700">
              Extracurriculars (comma-separated)
            </label>
            <textarea
              id="extracurriculars"
              rows={3}
              value={extracurriculars}
              onChange={(event) => setExtracurriculars(event.target.value)}
              placeholder="e.g., Debate Team Captain, Math Olympiad, Volunteer at Food Bank, Varsity Tennis"
              className={inputClassName}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Submit Your Result"}
        </button>
      </form>
    </div>
  );
}
