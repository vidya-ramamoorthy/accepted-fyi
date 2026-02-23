import { getDecisionCardColors, getCardRoundLabel } from "@/lib/cards/card-utils";

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
 * Privacy: Cards intentionally exclude GPA, SAT, and ACT scores.
 * Shows: school logo, name, location, decision, major, round, cycle, watermark.
 */
export default function DecisionCardLayout({ data, variant }: DecisionCardLayoutProps) {
  const colors = getDecisionCardColors(data.decision);
  const roundLabel = getCardRoundLabel(data.applicationRound);
  const logoUrl = getSchoolLogoUrl(data.schoolWebsite);
  const location = getLocationString(data.schoolCity, data.schoolState);

  if (variant === "story") {
    return (
      <StoryCard
        data={data}
        colors={colors}
        roundLabel={roundLabel}
        logoUrl={logoUrl}
        location={location}
      />
    );
  }

  return (
    <OgCard
      data={data}
      colors={colors}
      roundLabel={roundLabel}
      logoUrl={logoUrl}
      location={location}
    />
  );
}

// --- Shared Types ---

interface CardVariantProps {
  data: DecisionCardData;
  colors: { accent: string; badge: string; badgeText: string; label: string };
  roundLabel: string;
  logoUrl: string | null;
  location: string;
}

// --- OG Card (1200x630) ---

function OgCard({ data, colors, roundLabel, logoUrl, location }: CardVariantProps) {
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
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              width={56}
              height={56}
              style={{ borderRadius: 12, backgroundColor: "#1e293b" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 56,
                height: 56,
                borderRadius: 12,
                backgroundColor: "#1e293b",
                fontSize: 28,
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
                marginTop: 6,
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

        {/* Major + Round + Cycle */}
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
              {data.intendedMajor} · {roundLabel}
            </div>
          )}
          {!data.intendedMajor && (
            <div
              style={{
                display: "flex",
                fontSize: 22,
                color: "#cbd5e1",
              }}
            >
              {roundLabel}
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

      {/* Footer */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 56px",
          height: 64,
          borderTop: "1px solid rgba(148, 163, 184, 0.15)",
        }}
      >
        <div style={{ display: "flex", fontSize: 20, fontWeight: 700, color: "#a78bfa" }}>
          accepted.fyi
        </div>
        <div style={{ display: "flex", fontSize: 16, color: "#64748b" }}>
          Share your results
        </div>
      </div>
    </div>
  );
}

// --- Story Card (1080x1920) ---

function StoryCard({ data, colors, roundLabel, logoUrl, location }: CardVariantProps) {
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

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "80px 64px 0 64px",
          alignItems: "center",
          textAlign: "center" as const,
        }}
      >
        {/* Brand */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 700,
            color: "#a78bfa",
            letterSpacing: "0.05em",
          }}
        >
          accepted.fyi
        </div>

        {/* School logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 64,
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              width={80}
              height={80}
              style={{ borderRadius: 20, backgroundColor: "#1e293b" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 80,
                height: 80,
                borderRadius: 20,
                backgroundColor: "#1e293b",
                fontSize: 40,
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
            marginTop: 32,
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

        {/* Major + Round */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#cbd5e1",
            marginTop: 40,
          }}
        >
          {data.intendedMajor ? `${data.intendedMajor} · ${roundLabel}` : roundLabel}
        </div>

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

      {/* Footer */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 64px 80px 64px",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            height: 1,
            backgroundColor: "rgba(148, 163, 184, 0.15)",
          }}
        />
        <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#a78bfa", marginTop: 20 }}>
          accepted.fyi
        </div>
      </div>
    </div>
  );
}
