"use client";

import { useState } from "react";

const FLAG_REASONS = [
  "Inaccurate data",
  "Spam/fake submission",
  "Duplicate entry",
  "Other",
] as const;

interface FlagButtonProps {
  submissionId: string;
}

export default function FlagButton({ submissionId }: FlagButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flagResult, setFlagResult] = useState<"success" | "already_flagged" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (flagResult === "success") {
    return (
      <span className="text-xs text-slate-500">Flagged</span>
    );
  }

  if (flagResult === "already_flagged") {
    return (
      <span className="text-xs text-slate-500">Already flagged</span>
    );
  }

  async function handleSubmitFlag() {
    const reason = selectedReason === "Other" ? customReason.trim() : selectedReason;
    if (!reason) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/submissions/${submissionId}/flag`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.status === 201) {
        setFlagResult("success");
        setIsOpen(false);
      } else if (response.status === 409) {
        setFlagResult("already_flagged");
        setIsOpen(false);
      } else if (response.status === 401) {
        setErrorMessage("Sign in to flag submissions");
      } else if (response.status === 403) {
        setErrorMessage("You cannot flag your own submission");
      } else {
        const data = await response.json();
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
        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs text-slate-600 transition-colors hover:bg-slate-800 hover:text-slate-400"
        aria-label="Flag this submission"
        title="Report this submission"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 16 16"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M3.5 2a.5.5 0 0 1 .5.5v1h8.5a.5.5 0 0 1 .37.83L10.28 7.5l2.59 3.17a.5.5 0 0 1-.37.83H4v2a.5.5 0 0 1-1 0v-11a.5.5 0 0 1 .5-.5Z" />
        </svg>
        Flag
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 z-10 mb-2 w-64 rounded-lg border border-white/10 bg-slate-900 p-3 shadow-xl">
          <p className="mb-2 text-xs font-medium text-slate-300">Why are you flagging this?</p>
          <div className="space-y-1.5">
            {FLAG_REASONS.map((reason) => (
              <label
                key={reason}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
              >
                <input
                  type="radio"
                  name={`flag-reason-${submissionId}`}
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={() => setSelectedReason(reason)}
                  className="accent-violet-500"
                />
                {reason}
              </label>
            ))}
          </div>

          {selectedReason === "Other" && (
            <textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Describe the issue..."
              maxLength={500}
              rows={2}
              className="mt-2 w-full rounded border border-white/10 bg-slate-800 px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:border-violet-500 focus:outline-none"
            />
          )}

          {errorMessage && (
            <p className="mt-2 text-xs text-red-400">{errorMessage}</p>
          )}

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSelectedReason("");
                setCustomReason("");
                setErrorMessage(null);
              }}
              className="rounded px-2.5 py-1 text-xs text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmitFlag}
              disabled={
                isSubmitting ||
                !selectedReason ||
                (selectedReason === "Other" && !customReason.trim())
              }
              className="rounded bg-red-600/80 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit Flag"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
