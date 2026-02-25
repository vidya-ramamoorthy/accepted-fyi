"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SchoolAutocomplete from "@/components/SchoolAutocomplete";

const inputClassName =
  "w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500";

interface SchoolSearchFormProps {
  initialQuery?: string;
  initialState?: string;
}

export default function SchoolSearchForm({ initialQuery = "", initialState = "" }: SchoolSearchFormProps) {
  const router = useRouter();
  const [schoolQuery, setSchoolQuery] = useState(initialQuery);
  const [stateFilter, setStateFilter] = useState(initialState);

  function navigateWithFilters(query: string, state: string) {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (state) params.set("state", state);
    const queryString = params.toString();
    router.push(`/schools${queryString ? `?${queryString}` : ""}`);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    navigateWithFilters(schoolQuery, stateFilter);
  }

  function handleSchoolSelect(schoolName: string, schoolState?: string) {
    setSchoolQuery(schoolName);
    if (schoolState) {
      setStateFilter(schoolState);
    }
  }

  function handleAutocompleteEnter() {
    navigateWithFilters(schoolQuery, stateFilter);
  }

  function handleClear() {
    setSchoolQuery("");
    setStateFilter("");
    router.push("/schools");
  }

  const hasActiveFilters = schoolQuery || stateFilter;

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <SchoolAutocomplete
          value={schoolQuery}
          onSelect={handleSchoolSelect}
          onEnter={handleAutocompleteEnter}
          placeholder="Search schools..."
          className={inputClassName}
        />
      </div>
      <input
        type="text"
        value={stateFilter}
        onChange={(event) => setStateFilter(event.target.value.toUpperCase())}
        onKeyDown={(event) => event.key === "Enter" && handleSubmit(event)}
        maxLength={2}
        placeholder="State (e.g., CA)"
        className={`${inputClassName} uppercase sm:w-28`}
      />
      <button
        type="submit"
        className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-violet-700"
      >
        Search
      </button>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-center text-sm text-slate-400 hover:text-white"
        >
          Clear
        </button>
      )}
    </form>
  );
}
