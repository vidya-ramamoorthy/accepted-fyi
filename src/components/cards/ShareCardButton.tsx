"use client";

import { useState, useCallback, useMemo } from "react";
import type { HideableField } from "@/lib/cards/card-utils";

interface ShareCardButtonProps {
  submissionId: string;
  schoolName: string;
  hasGpa: boolean;
  hasSat: boolean;
  hasAct: boolean;
  hasState: boolean;
}

interface StatToggle {
  field: HideableField;
  label: string;
  enabled: boolean;
}

export default function ShareCardButton({
  submissionId,
  schoolName,
  hasGpa,
  hasSat,
  hasAct,
  hasState,
}: ShareCardButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");

  // Per-field visibility toggles — only show toggles for fields the user actually has
  const [hiddenFields, setHiddenFields] = useState<Set<HideableField>>(new Set());

  const availableToggles = useMemo<StatToggle[]>(() => {
    const toggles: StatToggle[] = [];
    if (hasGpa) toggles.push({ field: "gpa", label: "GPA", enabled: !hiddenFields.has("gpa") });
    if (hasSat) toggles.push({ field: "sat", label: "SAT", enabled: !hiddenFields.has("sat") });
    if (hasAct) toggles.push({ field: "act", label: "ACT", enabled: !hiddenFields.has("act") });
    if (hasState) toggles.push({ field: "state", label: "State", enabled: !hiddenFields.has("state") });
    return toggles;
  }, [hasGpa, hasSat, hasAct, hasState, hiddenFields]);

  const hasAnyToggleable = availableToggles.length > 0;

  const toggleField = useCallback((field: HideableField) => {
    setHiddenFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }, []);

  /** Build the ?hide=sat,act query string for hidden fields */
  const hideQueryString = useMemo(() => {
    if (hiddenFields.size === 0) return "";
    return `hide=${Array.from(hiddenFields).join(",")}`;
  }, [hiddenFields]);

  /** Build the full API URL with size and hide params */
  const buildApiUrl = useCallback(
    (size: "og" | "story") => {
      const params = new URLSearchParams();
      if (size === "story") params.set("size", "story");
      if (hiddenFields.size > 0) params.set("hide", Array.from(hiddenFields).join(","));
      const queryString = params.toString();
      return `/api/og/card/${submissionId}${queryString ? `?${queryString}` : ""}`;
    },
    [submissionId, hiddenFields]
  );

  const getCardPageUrl = useCallback(
    () => `${window.location.origin}/card/${submissionId}`,
    [submissionId]
  );

  const downloadCard = useCallback(
    async (size: "og" | "story") => {
      setIsDownloading(true);
      setShowDownloadMenu(false);
      try {
        const response = await fetch(buildApiUrl(size));
        if (!response.ok) {
          throw new Error(`Download failed: ${response.status}`);
        }
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);

        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        const dimensions = size === "story" ? "1080x1920" : "1200x630";
        anchor.download = `${schoolName.replace(/\s+/g, "-").toLowerCase()}-${dimensions}.png`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(blobUrl);
      } catch {
        console.error("Failed to download card image");
      } finally {
        setIsDownloading(false);
      }
    },
    [buildApiUrl, schoolName]
  );

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(getCardPageUrl());
    setShareStatus("copied");
    setTimeout(() => setShareStatus("idle"), 2000);
  }, [getCardPageUrl]);

  const shareCard = useCallback(async () => {
    if (typeof navigator.share !== "undefined") {
      try {
        const response = await fetch(buildApiUrl("og"));
        const blob = await response.blob();
        const file = new File([blob], `${schoolName.replace(/\s+/g, "-").toLowerCase()}.png`, {
          type: "image/png",
        });

        await navigator.share({
          title: `My admission result — ${schoolName}`,
          text: `Check out my admission result for ${schoolName} on accepted.fyi`,
          url: getCardPageUrl(),
          files: [file],
        });
        setShareStatus("shared");
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          await copyToClipboard();
        }
      }
    } else {
      await copyToClipboard();
    }
  }, [buildApiUrl, schoolName, getCardPageUrl, copyToClipboard]);

  return (
    <div className="flex flex-col gap-2">
      {/* Stat visibility toggles */}
      {hasAnyToggleable && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
            Show on card:
          </span>
          {availableToggles.map((toggle) => (
            <button
              key={toggle.field}
              onClick={() => toggleField(toggle.field)}
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors ${
                toggle.enabled
                  ? "bg-violet-600/20 text-violet-400"
                  : "bg-slate-800 text-slate-500 line-through"
              }`}
            >
              {toggle.label}
            </button>
          ))}
        </div>
      )}

      {/* Share + Download row */}
      <div className="flex items-center gap-2">
        {/* Share button */}
        <button
          onClick={shareCard}
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600/10 px-3 py-1.5 text-xs font-medium text-violet-400 transition-colors hover:bg-violet-600/20"
        >
          <ShareIcon />
          {shareStatus === "copied" ? "Link Copied!" : shareStatus === "shared" ? "Shared!" : "Share"}
        </button>

        {/* Download dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700 disabled:opacity-50"
          >
            <DownloadIcon />
            {isDownloading ? "Downloading..." : "Download"}
          </button>

          {showDownloadMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDownloadMenu(false)}
              />
              <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-white/10 bg-slate-800 py-1 shadow-xl">
                <button
                  onClick={() => downloadCard("og")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-700"
                >
                  <span className="font-medium">Twitter / Link Preview</span>
                  <span className="text-slate-500">1200x630</span>
                </button>
                <button
                  onClick={() => downloadCard("story")}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-700"
                >
                  <span className="font-medium">Story / TikTok</span>
                  <span className="text-slate-500">1080x1920</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
