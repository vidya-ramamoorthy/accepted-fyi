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

function getLocationString(city: string | null, state: string): string {
  if (city) return `${city}, ${state}`;
  return state;
}

/**
 * Pure presentational card layout for Satori image generation.
 * Uses ONLY inline styles — Satori does not support Tailwind or CSS classes.
 *
 * Design: Typography Hero — the school name IS the visual hero.
 * Bold, massive text. No logos (favicons look bad at scale).
 * Celebrates the student's achievement, not our brand.
 */
export default function DecisionCardLayout({ data, variant }: DecisionCardLayoutProps) {
  const colors = getDecisionCardColors(data.decision);
  const location = getLocationString(data.schoolCity, data.schoolState);

  if (variant === "story") {
    return <StoryCard data={data} colors={colors} location={location} />;
  }

  return <OgCard data={data} colors={colors} location={location} />;
}

// --- Shared Types ---

interface CardVariantProps {
  data: DecisionCardData;
  colors: { accent: string; badge: string; badgeText: string; label: string };
  location: string;
}

// --- OG Card (1200x630) ---

function OgCard({ data, colors, location }: CardVariantProps) {
  const detailParts = [data.intendedMajor, data.admissionCycle].filter(Boolean);
  const detailLine = detailParts.join(" · ");

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
          padding: "52px 64px 0 64px",
          justifyContent: "center",
        }}
      >
        {/* School name — the hero */}
        <div
          style={{
            display: "flex",
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.03em",
          }}
        >
          {data.schoolName.toUpperCase()}
        </div>

        {/* Location */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#94a3b8",
            marginTop: 12,
          }}
        >
          {location}
        </div>

        {/* Decision badge — large and prominent */}
        <div
          style={{
            display: "flex",
            marginTop: 36,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.badge,
              color: colors.badgeText,
              fontSize: 32,
              fontWeight: 700,
              borderRadius: 14,
              padding: "16px 44px",
              letterSpacing: "0.06em",
            }}
          >
            {colors.label.toUpperCase()}
          </div>
        </div>

        {/* Details line */}
        {detailLine && (
          <div
            style={{
              display: "flex",
              fontSize: 20,
              color: "#94a3b8",
              marginTop: 24,
            }}
          >
            {detailLine}
          </div>
        )}
      </div>

      {/* Footer — subtle watermark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 64px",
          height: 48,
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

function StoryCard({ data, colors, location }: CardVariantProps) {
  const detailParts = [data.intendedMajor, data.admissionCycle].filter(Boolean);
  const detailLine = detailParts.join(" · ");

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

      {/* Main content — vertically centered */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "0 72px",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center" as const,
        }}
      >
        {/* School name — massive hero text */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.0,
            letterSpacing: "-0.03em",
            textAlign: "center" as const,
          }}
        >
          {data.schoolName.toUpperCase()}
        </div>

        {/* Location */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#94a3b8",
            marginTop: 20,
          }}
        >
          {location}
        </div>

        {/* Decision badge — big */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.badge,
            color: colors.badgeText,
            fontSize: 44,
            fontWeight: 700,
            borderRadius: 20,
            padding: "28px 64px",
            letterSpacing: "0.08em",
            marginTop: 64,
          }}
        >
          {colors.label.toUpperCase()}
        </div>

        {/* Details line */}
        {detailLine && (
          <div
            style={{
              display: "flex",
              fontSize: 26,
              color: "#94a3b8",
              marginTop: 36,
            }}
          >
            {detailLine}
          </div>
        )}
      </div>

      {/* Footer — subtle watermark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 72px 60px 72px",
        }}
      >
        <div style={{ display: "flex", fontSize: 18, color: "#475569" }}>
          accepted.fyi
        </div>
      </div>
    </div>
  );
}
