"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OUTCOME_OPTIONS = [
  { value: "accepted_off_waitlist", label: "Accepted off waitlist" },
  { value: "rejected_off_waitlist", label: "Rejected off waitlist" },
  { value: "withdrew", label: "Withdrew" },
] as const;

interface UpdateOutcomeButtonProps {
  submissionId: string;
  schoolName: string;
}

export default function UpdateOutcomeButton({
  submissionId,
  schoolName,
}: UpdateOutcomeButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!selectedOutcome) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waitlistOutcome: selectedOutcome }),
      });

      if (response.ok) {
        setIsOpen(false);
        router.refresh();
      } else if (response.status === 401) {
        setErrorMessage("Sign in to update your submission");
      } else if (response.status === 403) {
        setErrorMessage("You can only update your own submissions");
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMessage(data.error ?? "Something went wrong");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-500/20"
        aria-label={`Update waitlist outcome for ${schoolName}`}
      >
        Update outcome
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-10 mt-2 w-64 rounded-lg border border-white/10 bg-slate-900 p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium text-slate-300">
            What happened with the waitlist at {schoolName}?
          </p>
          <div className="space-y-1.5">
            {OUTCOME_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
              >
                <input
                  type="radio"
                  name={`outcome-${submissionId}`}
                  value={option.value}
                  checked={selectedOutcome === option.value}
                  onChange={() => setSelectedOutcome(option.value)}
                  className="accent-violet-500"
                />
                {option.label}
              </label>
            ))}
          </div>

          {errorMessage && (
            <p className="mt-2 text-xs text-red-400">{errorMessage}</p>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSelectedOutcome("");
                setErrorMessage(null);
              }}
              className="rounded px-2.5 py-1 text-xs text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedOutcome}
              className="rounded bg-violet-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
