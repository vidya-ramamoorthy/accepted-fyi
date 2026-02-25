"use client";

import { useState, useEffect } from "react";

interface CountdownBadgeProps {
  targetDate: string;
}

export default function CountdownBadge({ targetDate }: CountdownBadgeProps) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    const releaseDate = new Date(targetDate);
    const now = new Date();
    const past = releaseDate < now;
    setIsPast(past);
    if (!past) {
      setDaysRemaining(
        Math.ceil((releaseDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      );
    }
  }, [targetDate]);

  if (daysRemaining === null && !isPast) {
    return null;
  }

  if (isPast) {
    return <span className="text-xs text-slate-600">Released</span>;
  }

  if (daysRemaining !== null && daysRemaining > 0) {
    return (
      <span className="text-xs text-violet-400">
        {daysRemaining}d away
      </span>
    );
  }

  return null;
}
