import { getDecisionCardColors, getCardRoundLabel } from "@/lib/cards/card-utils";
import type { CardStatItem } from "@/lib/cards/card-utils";

export interface DecisionCardData {
  schoolName: string;
  schoolState: string;
  schoolCity: string | null;
  schoolWebsite: string | null;
  decision: string;
  applicationRound: string;
  admissionCycle: string;
  intendedMajor: string | null;
  /** Filtered stat items (already excludes hidden fields + nulls) */
  statItems: CardStatItem[];
  /** School brand color hex for accent gradient */
  schoolColor: string;
  /** Community stats: number accepted out of total, or null if no data */
  communityAccepted: number | null;
  communityTotal: number | null;
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
 * Mix a hex color with the dark background at a given opacity.
 * Returns an rgb() string suitable for inline styles.
 */
function tintColor(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Blend with #0f172a (slate-900) background
  const bgR = 15, bgG = 23, bgB = 42;
  const blendedR = Math.round(bgR + (r - bgR) * opacity);
  const blendedG = Math.round(bgG + (g - bgG) * opacity);
  const blendedB = Math.round(bgB + (b - bgB) * opacity);
  return `rgb(${blendedR}, ${blendedG}, ${blendedB})`;
}

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

// --- Community Stats Line ---

function CommunityLine({
  accepted,
  total,
  fontSize,
  color,
}: {
  accepted: number;
  total: number;
  fontSize: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize,
        color,
      }}
    >
      <svg width={fontSize} height={fontSize} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      {accepted} of {total} accepted
    </div>
  );
}

// --- Stat Box (OG card — grid cell) ---

function StatBox({
  label,
  value,
  schoolColor,
}: {
  label: string;
  value: string;
  schoolColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tintColor(schoolColor, 0.12),
        borderRadius: 12,
        padding: "14px 16px",
        minWidth: 110,
        border: `1px solid ${tintColor(schoolColor, 0.25)}`,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 28,
          fontWeight: 700,
          color: "#f1f5f9",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 13,
          color: "#94a3b8",
          marginTop: 4,
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// --- Stat Pill (Story card — horizontal pill) ---

function StatPill({
  label,
  value,
  schoolColor,
}: {
  label: string;
  value: string;
  schoolColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: tintColor(schoolColor, 0.12),
        borderRadius: 16,
        padding: "18px 28px",
        border: `1px solid ${tintColor(schoolColor, 0.25)}`,
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 36,
          fontWeight: 700,
          color: "#f1f5f9",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 16,
          color: "#94a3b8",
          marginTop: 6,
          fontWeight: 400,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
    </div>
  );
}

// --- OG Card (1200x630) ---

function OgCard({ data, colors, location }: CardVariantProps) {
  const roundLabel = getCardRoundLabel(data.applicationRound);
  const detailParts = [data.intendedMajor, data.admissionCycle, roundLabel].filter(Boolean);
  const detailLine = detailParts.join(" · ");
  const hasStats = data.statItems.length > 0;
  const hasCommunity = data.communityAccepted !== null && data.communityTotal !== null && data.communityTotal > 0;

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
      {/* Gradient accent bar: decision color → school color */}
      <div
        style={{
          display: "flex",
          height: 6,
          background: `linear-gradient(to right, ${colors.accent}, ${data.schoolColor})`,
        }}
      />

      {/* Main content: left column + right column (stats) */}
      <div
        style={{
          display: "flex",
          flex: 1,
          padding: "40px 56px 0 56px",
        }}
      >
        {/* Left column: school info + decision */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            paddingRight: hasStats ? 40 : 0,
          }}
        >
          {/* School name */}
          <div
            style={{
              display: "flex",
              fontSize: 46,
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
              fontSize: 20,
              color: "#94a3b8",
              marginTop: 10,
            }}
          >
            {location}
          </div>

          {/* Decision badge */}
          <div style={{ display: "flex", marginTop: 28 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.badge,
                color: colors.badgeText,
                fontSize: 28,
                fontWeight: 700,
                borderRadius: 12,
                padding: "14px 40px",
                letterSpacing: "0.06em",
              }}
            >
              {colors.label.toUpperCase()}
            </div>
          </div>

          {/* Detail line */}
          {detailLine && (
            <div
              style={{
                display: "flex",
                fontSize: 18,
                color: "#94a3b8",
                marginTop: 18,
              }}
            >
              {detailLine}
            </div>
          )}
        </div>

        {/* Right column: stats grid */}
        {hasStats && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 12,
            }}
          >
            {/* First row */}
            <div style={{ display: "flex", gap: 12 }}>
              {data.statItems.slice(0, 2).map((item) => (
                <StatBox
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  schoolColor={data.schoolColor}
                />
              ))}
            </div>
            {/* Second row (if 3+ items) */}
            {data.statItems.length > 2 && (
              <div style={{ display: "flex", gap: 12 }}>
                {data.statItems.slice(2, 4).map((item) => (
                  <StatBox
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    schoolColor={data.schoolColor}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer: community stats + watermark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 56px",
          height: 56,
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          {hasCommunity && (
            <CommunityLine
              accepted={data.communityAccepted!}
              total={data.communityTotal!}
              fontSize={15}
              color="#64748b"
            />
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", fontSize: 17, fontWeight: 700, color: "#94a3b8" }}>
            accepted.fyi
          </div>
          <div style={{ display: "flex", fontSize: 12, color: "#475569", marginTop: 1 }}>
            Share yours →
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Story Card (1080x1920) ---

function StoryCard({ data, colors, location }: CardVariantProps) {
  const roundLabel = getCardRoundLabel(data.applicationRound);
  const detailParts = [data.intendedMajor, data.admissionCycle, roundLabel].filter(Boolean);
  const detailLine = detailParts.join(" · ");
  const hasStats = data.statItems.length > 0;
  const hasCommunity = data.communityAccepted !== null && data.communityTotal !== null && data.communityTotal > 0;

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
          background: `linear-gradient(to right, ${colors.accent}, ${data.schoolColor})`,
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
        }}
      >
        {/* School name */}
        <div
          style={{
            display: "flex",
            fontSize: 68,
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
            fontSize: 26,
            color: "#94a3b8",
            marginTop: 16,
          }}
        >
          {location}
        </div>

        {/* Decision badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: colors.badge,
            color: colors.badgeText,
            fontSize: 42,
            fontWeight: 700,
            borderRadius: 20,
            padding: "24px 60px",
            letterSpacing: "0.08em",
            marginTop: 56,
          }}
        >
          {colors.label.toUpperCase()}
        </div>

        {/* Detail line */}
        {detailLine && (
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#94a3b8",
              marginTop: 28,
            }}
          >
            {detailLine}
          </div>
        )}

        {/* Stat pills — horizontal row */}
        {hasStats && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 16,
              marginTop: 56,
            }}
          >
            {data.statItems.map((item) => (
              <StatPill
                key={item.label}
                label={item.label}
                value={item.value}
                schoolColor={data.schoolColor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer: community stats + watermark */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "0 72px 60px 72px",
          gap: 12,
        }}
      >
        {hasCommunity && (
          <CommunityLine
            accepted={data.communityAccepted!}
            total={data.communityTotal!}
            fontSize={20}
            color="#64748b"
          />
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", fontSize: 22, fontWeight: 700, color: "#94a3b8" }}>
            accepted.fyi
          </div>
          <div style={{ display: "flex", fontSize: 14, color: "#475569", marginTop: 2 }}>
            Share yours →
          </div>
        </div>
      </div>
    </div>
  );
}
