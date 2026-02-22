"use client";

import { useState, useMemo } from "react";
import SchoolCard from "./SchoolCard";
import { US_STATES } from "@/lib/constants/us-states";
import {
  SAT_RANGES,
  ACT_RANGES,
  ACCEPTANCE_RATE_RANGES,
} from "@/lib/constants/score-ranges";

type HideableFilter = "state" | "sat" | "act" | "acceptanceRate" | "schoolType";

interface SchoolData {
  id: string;
  slug: string | null;
  name: string;
  city: string;
  state: string;
  schoolType: "public" | "private" | "community_college";
  acceptanceRate: string | null;
  satAverage: number | null;
  sat25thPercentile: number | null;
  sat75thPercentile: number | null;
  actMedian: number | null;
  act25thPercentile: number | null;
  act75thPercentile: number | null;
  undergradEnrollment: number | null;
}

interface FilterableSchoolGridProps {
  schools: SchoolData[];
  hideFilter?: HideableFilter;
}

const SCHOOL_TYPE_OPTIONS = [
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "community_college", label: "Community College" },
] as const;

export default function FilterableSchoolGrid({
  schools,
  hideFilter,
}: FilterableSchoolGridProps) {
  const [selectedState, setSelectedState] = useState("");
  const [selectedAcceptanceRate, setSelectedAcceptanceRate] = useState("");
  const [selectedSatRange, setSelectedSatRange] = useState("");
  const [selectedActRange, setSelectedActRange] = useState("");
  const [selectedSchoolType, setSelectedSchoolType] = useState("");

  const hasActiveFilters =
    selectedState !== "" ||
    selectedAcceptanceRate !== "" ||
    selectedSatRange !== "" ||
    selectedActRange !== "" ||
    selectedSchoolType !== "";

  const filteredSchools = useMemo(() => {
    return schools.filter((school) => {
      if (selectedState && school.state !== selectedState) {
        return false;
      }

      if (selectedAcceptanceRate) {
        const acceptanceRateRange = ACCEPTANCE_RATE_RANGES.find(
          (range) => range.slug === selectedAcceptanceRate
        );
        if (acceptanceRateRange) {
          const rate = school.acceptanceRate
            ? parseFloat(school.acceptanceRate)
            : null;
          if (
            rate === null ||
            rate < acceptanceRateRange.min ||
            rate > acceptanceRateRange.max
          ) {
            return false;
          }
        }
      }

      if (selectedSatRange) {
        const satRange = SAT_RANGES.find(
          (range) => range.slug === selectedSatRange
        );
        if (satRange) {
          const sat25 = school.sat25thPercentile;
          const sat75 = school.sat75thPercentile;
          if (sat25 === null || sat75 === null || sat25 > satRange.max || sat75 < satRange.min) {
            return false;
          }
        }
      }

      if (selectedActRange) {
        const actRange = ACT_RANGES.find(
          (range) => range.slug === selectedActRange
        );
        if (actRange) {
          const act25 = school.act25thPercentile;
          const act75 = school.act75thPercentile;
          if (act25 === null || act75 === null || act25 > actRange.max || act75 < actRange.min) {
            return false;
          }
        }
      }

      if (selectedSchoolType && school.schoolType !== selectedSchoolType) {
        return false;
      }

      return true;
    });
  }, [
    schools,
    selectedState,
    selectedAcceptanceRate,
    selectedSatRange,
    selectedActRange,
    selectedSchoolType,
  ]);

  function clearAllFilters() {
    setSelectedState("");
    setSelectedAcceptanceRate("");
    setSelectedSatRange("");
    setSelectedActRange("");
    setSelectedSchoolType("");
  }

  const selectClassName =
    "rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-white/20 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

  return (
    <div>
      {/* Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {hideFilter !== "state" && (
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className={selectClassName}
            aria-label="Filter by state"
          >
            <option value="">All States</option>
            {US_STATES.map((usState) => (
              <option key={usState.abbreviation} value={usState.abbreviation}>
                {usState.name}
              </option>
            ))}
          </select>
        )}

        {hideFilter !== "acceptanceRate" && (
          <select
            value={selectedAcceptanceRate}
            onChange={(e) => setSelectedAcceptanceRate(e.target.value)}
            className={selectClassName}
            aria-label="Filter by acceptance rate"
          >
            <option value="">All Acceptance Rates</option>
            {ACCEPTANCE_RATE_RANGES.map((range) => (
              <option key={range.slug} value={range.slug}>
                {range.label}
              </option>
            ))}
          </select>
        )}

        {hideFilter !== "sat" && (
          <select
            value={selectedSatRange}
            onChange={(e) => setSelectedSatRange(e.target.value)}
            className={selectClassName}
            aria-label="Filter by SAT score"
          >
            <option value="">All SAT Scores</option>
            {SAT_RANGES.map((range) => (
              <option key={range.slug} value={range.slug}>
                {range.label}
              </option>
            ))}
          </select>
        )}

        {hideFilter !== "act" && (
          <select
            value={selectedActRange}
            onChange={(e) => setSelectedActRange(e.target.value)}
            className={selectClassName}
            aria-label="Filter by ACT score"
          >
            <option value="">All ACT Scores</option>
            {ACT_RANGES.map((range) => (
              <option key={range.slug} value={range.slug}>
                {range.label}
              </option>
            ))}
          </select>
        )}

        {hideFilter !== "schoolType" && (
          <select
            value={selectedSchoolType}
            onChange={(e) => setSelectedSchoolType(e.target.value)}
            className={selectClassName}
            aria-label="Filter by school type"
          >
            <option value="">All School Types</option>
            {SCHOOL_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition-colors hover:border-white/20 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Count */}
      <p className="mt-4 text-sm text-slate-500">
        Showing {filteredSchools.length} of {schools.length} schools
      </p>

      {/* Grid */}
      {filteredSchools.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/5 bg-slate-900/50 p-16 text-center">
          <h2 className="text-lg font-semibold text-white">
            No schools match your filters
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
            Try adjusting or clearing your filters to see more results.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => (
            <SchoolCard key={school.id} {...school} />
          ))}
        </div>
      )}
    </div>
  );
}
