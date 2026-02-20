"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const DECISION_OPTIONS = [
  { value: "", label: "All Decisions" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "deferred", label: "Deferred" },
];

const CYCLE_OPTIONS = [
  { value: "", label: "All Cycles" },
  { value: "2025-2026", label: "2025-2026" },
  { value: "2024-2025", label: "2024-2025" },
  { value: "2023-2024", label: "2023-2024" },
];

export default function SubmissionFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [schoolSearch, setSchoolSearch] = useState(searchParams.get("school") ?? "");
  const [decision, setDecision] = useState(searchParams.get("decision") ?? "");
  const [cycle, setCycle] = useState(searchParams.get("cycle") ?? "");
  const [stateFilter, setStateFilter] = useState(searchParams.get("state") ?? "");

  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (schoolSearch) params.set("school", schoolSearch);
    if (decision) params.set("decision", decision);
    if (cycle) params.set("cycle", cycle);
    if (stateFilter) params.set("state", stateFilter);

    const queryString = params.toString();
    router.push(`/browse${queryString ? `?${queryString}` : ""}`);
  }, [schoolSearch, decision, cycle, stateFilter, router]);

  const clearFilters = useCallback(() => {
    setSchoolSearch("");
    setDecision("");
    setCycle("");
    setStateFilter("");
    router.push("/browse");
  }, [router]);

  const hasActiveFilters = schoolSearch || decision || cycle || stateFilter;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="school-filter" className="block text-xs font-medium text-gray-500">
            School
          </label>
          <input
            id="school-filter"
            type="text"
            value={schoolSearch}
            onChange={(event) => setSchoolSearch(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && applyFilters()}
            placeholder="Search schools..."
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="decision-filter" className="block text-xs font-medium text-gray-500">
            Decision
          </label>
          <select
            id="decision-filter"
            value={decision}
            onChange={(event) => setDecision(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {DECISION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cycle-filter" className="block text-xs font-medium text-gray-500">
            Cycle
          </label>
          <select
            id="cycle-filter"
            value={cycle}
            onChange={(event) => setCycle(event.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {CYCLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="state-filter" className="block text-xs font-medium text-gray-500">
            State
          </label>
          <input
            id="state-filter"
            type="text"
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value.toUpperCase())}
            onKeyDown={(event) => event.key === "Enter" && applyFilters()}
            maxLength={2}
            placeholder="e.g., CA"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={applyFilters}
          className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Apply Filters
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
