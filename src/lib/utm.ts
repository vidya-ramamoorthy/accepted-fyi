const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;
const STORAGE_KEY = "accepted_fyi_utm";

export type UtmParams = Partial<Record<(typeof UTM_PARAMS)[number], string>>;

/**
 * Capture UTM parameters from the current URL and store in sessionStorage.
 * Only captures on the first page load that has UTM params — subsequent
 * navigations within the session preserve the original attribution.
 */
export function captureUtmParams(): UtmParams | null {
  if (typeof window === "undefined") return null;

  const existingUtm = getStoredUtmParams();
  if (existingUtm) return existingUtm;

  const searchParams = new URLSearchParams(window.location.search);
  const utmParams: UtmParams = {};
  let hasUtmParam = false;

  for (const param of UTM_PARAMS) {
    const value = searchParams.get(param);
    if (value) {
      utmParams[param] = value;
      hasUtmParam = true;
    }
  }

  if (!hasUtmParam) return null;

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(utmParams));
  } catch {
    // sessionStorage unavailable (private browsing, storage full)
  }

  return utmParams;
}

export function getStoredUtmParams(): UtmParams | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? (JSON.parse(stored) as UtmParams) : null;
  } catch {
    return null;
  }
}
