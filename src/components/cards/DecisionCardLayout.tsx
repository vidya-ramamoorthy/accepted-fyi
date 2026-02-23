import { getDecisionCardColors } from "@/lib/cards/card-utils";

export interface DecisionCardData {
  schoolName: string;
  schoolState: string;
  schoolCity: string | null;
  schoolWebsite: string | null;
  decision: string;
  applicationRound: string;
  admissionCycle: string;
  intendedMajor: string | null;
}

interface DecisionCardLayoutProps {
  data: DecisionCardData;
  variant: "og" | "story";
}

/**
 * Derives a Google Favicon URL from a school website domain.
 * Falls back to null if no website is available.
 */
function getSchoolLogoUrl(website: string | null): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch {
    return null;
  }
}

function getLocationString(city: string | null, state: string): string {
  if (city) return `${city}, ${state}`;
  return state;
}

/**
 * Pure presentational card layout for Satori image generation.
 * Uses ONLY inline styles — Satori does not support Tailwind or CSS classes.
 *
 * Design philosophy: celebrate the student's achievement. The card is about
 * THEM, not about us. Branding is a subtle watermark at the bottom.
 * No GPA/SAT/ACT (privacy). No ED/EA/RD round labels (unnecessary clutter).
 */
export default function DecisionCardLayout({ data, variant }: DecisionCardLayoutProps) {
  const colors = getDecisionCardColors(data.decision);
  const logoUrl = getSchoolLogoUrl(data.schoolWebsite);
  const location = getLocationString(data.schoolCity, data.schoolState);

  if (variant === "story") {
    return (
      <StoryCard
        data={data}
        colors={colors}
        logoUrl={logoUrl}
        location={location}
      />
    );
  }

  return (
    <OgCard
      data={data}
      colors={colors}
      logoUrl={logoUrl}
      location={location}
    />
  );
}

// --- Shared Types ---

interface CardVariantProps {
  data: DecisionCardData;
  colors: { accent: string; badge: string; badgeText: string; label: string };
  logoUrl: string | null;
  location: string;
}

// --- OG Card (1200x630) ---

function OgCard({ data, colors, logoUrl, location }: CardVariantProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1200,
        height: 630,
        backgroundColor: "#0f172a",
        fontFamily: "Inter, sans-serif",
        color: "#f8fafc",
      }}
    >
      {/* Gradient accent bar */}
      <div
        style={{
          display: "flex",
          height: 6,
          background: `linear-gradient(to right, ${colors.accent}, #6366f1)`,
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "48px 56px 0 56px",
        }}
      >
        {/* School header: logo + name + location */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              width={80}
              height={80}
              style={{ borderRadius: 16, backgroundColor: "#1e293b" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: 16,
                backgroundColor: "#1e293b",
                fontSize: 40,
                fontWeight: 700,
                color: "#a78bfa",
              }}
            >
              {data.schoolName.charAt(0)}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
              }}
            >
              {data.schoolName.toUpperCase()}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 20,
                color: "#94a3b8",
                marginTop: 8,
              }}
            >
              {location}
            </div>
          </div>
        </div>

        {/* Decision badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 48,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.badge,
              color: colors.badgeText,
              fontSize: 28,
              fontWeight: 700,
              borderRadius: 14,
              padding: "18px 48px",
              letterSpacing: "0.06em",
            }}
          >
            {colors.label.toUpperCase()}
          </div>
        </div>

        {/* Major + Cycle */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 28,
            gap: 8,
          }}
        >
          {data.intendedMajor && (
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#cbd5e1",
              }}
            >
              {data.intendedMajor}
            </div>
          )}
          <div
            style={{
              display: "flex",
              fontSize: 18,
              color: "#64748b",
            }}
          >
            {data.admissionCycle}
          </div>
        </div>
      </div>

      {/* Footer — subtle watermark, not the focus */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 56px",
          height: 52,
        }}
      >
        <div style={{ display: "flex", fontSize: 15, color: "#475569" }}>
          accepted.fyi
        </div>
      </div>
    </div>
  );
}

// --- Story Card (1080x1920) ---

function StoryCard({ data, colors, logoUrl, location }: CardVariantProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1080,
        height: 1920,
        backgroundColor: "#0f172a",
        fontFamily: "Inter, sans-serif",
        color: "#f8fafc",
      }}
    >
      {/* Gradient accent bar */}
      <div
        style={{
          display: "flex",
          height: 8,
          background: `linear-gradient(to right, ${colors.accent}, #6366f1)`,
        }}
      />

      {/* Main content — centered, all about the student */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "120px 64px 0 64px",
          alignItems: "center",
          textAlign: "center" as const,
        }}
      >
        {/* School logo — big and prominent */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              width={120}
              height={120}
              style={{ borderRadius: 28, backgroundColor: "#1e293b" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 120,
                height: 120,
                borderRadius: 28,
                backgroundColor: "#1e293b",
                fontSize: 60,
                fontWeight: 700,
                color: "#a78bfa",
              }}
            >
              {data.schoolName.charAt(0)}
            </div>
          )}
        </div>

        {/* School name + location */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginTop: 40,
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 52,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              textAlign: "center" as const,
            }}
          >
            {data.schoolName.toUpperCase()}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#94a3b8",
              marginTop: 16,
            }}
          >
            {location}
          </div>
        </div>

        {/* Decision badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.badge,
            color: colors.badgeText,
            fontSize: 36,
            fontWeight: 700,
            borderRadius: 16,
            padding: "24px 56px",
            letterSpacing: "0.08em",
            marginTop: 80,
          }}
        >
          {colors.label.toUpperCase()}
        </div>

        {/* Major */}
        {data.intendedMajor && (
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#cbd5e1",
              marginTop: 40,
            }}
          >
            {data.intendedMajor}
          </div>
        )}

        {/* Cycle */}
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#64748b",
            marginTop: 12,
          }}
        >
          {data.admissionCycle}
        </div>
      </div>

      {/* Footer — subtle watermark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 64px 60px 64px",
        }}
      >
        <div style={{ display: "flex", fontSize: 18, color: "#475569" }}>
          accepted.fyi
        </div>
      </div>
    </div>
  );
}
