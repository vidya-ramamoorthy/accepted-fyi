"use client";

import { useState } from "react";

const VISIBLE_COUNT = 5;

interface ExpandableExtracurricularsProps {
  extracurriculars: string[];
}

export default function ExpandableExtracurriculars({ extracurriculars }: ExpandableExtracurricularsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasOverflow = extracurriculars.length > VISIBLE_COUNT;
  const visibleItems = isExpanded ? extracurriculars : extracurriculars.slice(0, VISIBLE_COUNT);

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {visibleItems.map((ec, index) => (
        <span
          key={index}
          className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400"
        >
          {ec}
        </span>
      ))}
      {hasOverflow && !isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
        >
          +{extracurriculars.length - VISIBLE_COUNT} more
        </button>
      )}
      {hasOverflow && isExpanded && (
        <button
          type="button"
          onClick={() => setIsExpanded(false)}
          className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-700 hover:text-slate-300"
        >
          Show less
        </button>
      )}
    </div>
  );
}
