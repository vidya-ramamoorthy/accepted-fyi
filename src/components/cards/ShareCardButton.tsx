"use client";

import { useState, useCallback } from "react";

interface ShareCardButtonProps {
  submissionId: string;
  schoolName: string;
}

export default function ShareCardButton({ submissionId, schoolName }: ShareCardButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "shared">("idle");

  const cardPageUrl = `${window.location.origin}/card/${submissionId}`;

  const downloadCard = useCallback(
    async (size: "og" | "story") => {
      setIsDownloading(true);
      setShowDownloadMenu(false);
      try {
        const sizeParam = size === "story" ? "?size=story" : "";
        const response = await fetch(`/api/og/card/${submissionId}${sizeParam}`);
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
      } finally {
        setIsDownloading(false);
      }
    },
    [submissionId, schoolName]
  );

  const shareCard = useCallback(async () => {
    if (typeof navigator.share !== "undefined") {
      try {
        const response = await fetch(`/api/og/card/${submissionId}`);
        const blob = await response.blob();
        const file = new File([blob], `${schoolName.replace(/\s+/g, "-").toLowerCase()}.png`, {
          type: "image/png",
        });

        await navigator.share({
          title: `My admission result — ${schoolName}`,
          text: `Check out my admission result for ${schoolName} on accepted.fyi`,
          url: cardPageUrl,
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
  }, [submissionId, schoolName, cardPageUrl]);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(cardPageUrl);
    setShareStatus("copied");
    setTimeout(() => setShareStatus("idle"), 2000);
  }, [cardPageUrl]);

  return (
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
