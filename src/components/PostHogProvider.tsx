"use client";

import { useEffect } from "react";
import { initPostHog, posthog } from "@/lib/posthog";
import { captureUtmParams } from "@/lib/utm";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog();

    const utmParams = captureUtmParams();
    if (utmParams) {
      posthog.register(utmParams);
    }
  }, []);

  return <>{children}</>;
}
