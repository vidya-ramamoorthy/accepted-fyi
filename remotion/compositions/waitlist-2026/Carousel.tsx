import { AbsoluteFill } from "remotion";
import content from "./content.json";

export const CAROUSEL_WIDTH = 1080;
export const CAROUSEL_HEIGHT = 1350;

const palette = content.palette;

type ChartSpec = {
  type: string;
  key?: string;
  xField?: string;
  yField?: string;
  valueField?: string;
  totalField?: string;
  primary?: string;
};

interface Slide {
  slide: number;
  type: string;
  headline: string;
  sub: string;
  chart: ChartSpec | null;
}

const slides = content.carousel as Slide[];

// --- Shared layout ---

function Watermark({ small = false }: { small?: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: small ? 32 : 48,
        right: small ? 32 : 48,
        fontSize: small ? 22 : 28,
        color: palette.subtle,
        fontWeight: 400,
        letterSpacing: 0.5,
      }}
    >
      accepted.fyi
    </div>
  );
}

function SlideNumber({ index, total }: { index: number; total: number }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 48,
        left: 48,
        fontSize: 22,
        color: palette.subtle,
        fontWeight: 400,
        letterSpacing: 1,
      }}
    >
      {index} / {total}
    </div>
  );
}

// --- Chart primitives ---

function BarChart({
  data,
  xField,
  yField,
  accent,
}: {
  data: Array<Record<string, string | number>>;
  xField: string;
  yField: string;
  accent: string;
}) {
  const max = Math.max(...data.map((row) => Number(row[yField])));
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        gap: 14,
      }}
    >
      {data.map((row) => {
        const value = Number(row[yField]);
        const widthPct = (value / max) * 100;
        return (
          <div
            key={String(row[xField])}
            style={{ display: "flex", flexDirection: "column", gap: 4 }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 24,
                color: palette.primary,
                fontWeight: 400,
              }}
            >
              <span>{String(row[xField])}</span>
              <span style={{ color: palette.muted, fontWeight: 700 }}>
                {value}
              </span>
            </div>
            <div
              style={{
                height: 14,
                width: "100%",
                backgroundColor: "#1e293b",
                borderRadius: 7,
                overflow: "hidden",
                display: "flex",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${widthPct}%`,
                  backgroundColor: accent,
                  borderRadius: 7,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatBigNumber({
  primary,
  subtitle,
  accent,
}: {
  primary: string;
  subtitle: string;
  accent: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
      }}
    >
      <div
        style={{
          fontSize: 300,
          fontWeight: 700,
          color: accent,
          lineHeight: 1,
          letterSpacing: -4,
        }}
      >
        {primary}
      </div>
      <div
        style={{
          fontSize: 36,
          color: palette.muted,
          fontWeight: 400,
          textAlign: "center",
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

// --- Slide renderer ---

function SlideFrame({
  slide,
  children,
  centered = true,
}: {
  slide: Slide;
  children?: React.ReactNode;
  centered?: boolean;
}) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.background,
        fontFamily: "Inter, sans-serif",
        padding: 72,
        display: "flex",
        flexDirection: "column",
        justifyContent: centered ? "center" : "flex-start",
        alignItems: "stretch",
        gap: 32,
      }}
    >
      {children}
      <SlideNumber index={slide.slide} total={slides.length} />
      <Watermark />
    </AbsoluteFill>
  );
}

function HookSlide({ slide }: { slide: Slide }) {
  return (
    <SlideFrame slide={slide}>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: palette.primary,
          lineHeight: 1.1,
        }}
      >
        {slide.headline}
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: palette.accent,
          lineHeight: 1.1,
        }}
      >
        {slide.sub}
      </div>
    </SlideFrame>
  );
}

function SetupSlide({ slide }: { slide: Slide }) {
  return (
    <SlideFrame slide={slide}>
      <div
        style={{
          fontSize: 68,
          fontWeight: 700,
          color: palette.primary,
          lineHeight: 1.2,
        }}
      >
        {slide.headline}
      </div>
      <div
        style={{
          fontSize: 40,
          fontWeight: 400,
          color: palette.muted,
          lineHeight: 1.35,
        }}
      >
        {slide.sub}
      </div>
    </SlideFrame>
  );
}

function BarChartSlide({ slide }: { slide: Slide }) {
  const chartData =
    slide.chart?.key && slide.chart.key in content
      ? (content as unknown as Record<string, Array<Record<string, string | number>>>)[
          slide.chart.key
        ]
      : [];
  return (
    <SlideFrame slide={slide} centered={false}>
      <div style={{ marginTop: 40 }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: palette.primary,
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          {slide.headline}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: palette.muted,
            marginBottom: 48,
          }}
        >
          {slide.sub}
        </div>
        <BarChart
          data={chartData}
          xField={slide.chart?.xField ?? "name"}
          yField={slide.chart?.yField ?? "value"}
          accent={palette.accent}
        />
      </div>
    </SlideFrame>
  );
}

function CornellStatSlide({ slide }: { slide: Slide }) {
  const cornell = content.institutionalWaitlist.find(
    (r) => r.name === "Cornell"
  );
  if (!cornell) return null;
  return (
    <SlideFrame slide={slide}>
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: palette.primary,
          lineHeight: 1.2,
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        {slide.headline}
      </div>
      <StatBigNumber
        primary={cornell.admitted.toLocaleString()}
        subtitle={
          cornell.offered !== null
            ? `admitted off waitlist, from ${cornell.offered.toLocaleString()} offered`
            : `admitted off waitlist`
        }
        accent={palette.accent}
      />
      <div
        style={{
          fontSize: 32,
          fontWeight: 400,
          color: palette.muted,
          textAlign: "center",
          marginTop: 48,
        }}
      >
        {slide.sub}
      </div>
    </SlideFrame>
  );
}

function ZeroStatSlide({ slide }: { slide: Slide }) {
  return (
    <SlideFrame slide={slide}>
      <div
        style={{
          fontSize: 56,
          fontWeight: 700,
          color: palette.primary,
          lineHeight: 1.2,
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        {slide.headline}
      </div>
      <StatBigNumber
        primary="0"
        subtitle="admitted off the waitlist at Yale or Dartmouth (last reported cycle)"
        accent={palette.accent}
      />
      <div
        style={{
          fontSize: 32,
          fontWeight: 400,
          color: palette.muted,
          textAlign: "center",
          marginTop: 48,
        }}
      >
        {slide.sub}
      </div>
    </SlideFrame>
  );
}

function CompareBarSlide({ slide }: { slide: Slide }) {
  const data = content.institutionalWaitlist.map((r) => ({
    name: r.name,
    admitted: r.admitted,
  }));
  return (
    <SlideFrame slide={slide} centered={false}>
      <div style={{ marginTop: 40 }}>
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: palette.primary,
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          {slide.headline}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: palette.muted,
            marginBottom: 48,
          }}
        >
          {slide.sub}
        </div>
        <BarChart
          data={data}
          xField="name"
          yField="admitted"
          accent={palette.accent}
        />
        <div
          style={{
            fontSize: 22,
            color: palette.subtle,
            marginTop: 32,
            fontStyle: "italic",
          }}
        >
          Source: most recent Common Data Set filings.
        </div>
      </div>
    </SlideFrame>
  );
}

function SurpriseSlide({ slide }: { slide: Slide }) {
  return (
    <SlideFrame slide={slide}>
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: palette.accent,
          lineHeight: 1.15,
          marginBottom: 24,
        }}
      >
        {slide.headline}
      </div>
      <div
        style={{
          fontSize: 40,
          fontWeight: 400,
          color: palette.muted,
          lineHeight: 1.35,
        }}
      >
        {slide.sub}
      </div>
    </SlideFrame>
  );
}

function MeaningSlide({ slide }: { slide: Slide }) {
  return (
    <SlideFrame slide={slide}>
      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          color: palette.primary,
          lineHeight: 1.2,
          marginBottom: 32,
        }}
      >
        {slide.headline}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 400,
          color: palette.muted,
          lineHeight: 1.4,
        }}
      >
        {slide.sub}
      </div>
    </SlideFrame>
  );
}

function MethodologySlide({ slide }: { slide: Slide }) {
  return (
    <SlideFrame slide={slide} centered={false}>
      <div style={{ marginTop: 60 }}>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: palette.primary,
            lineHeight: 1.2,
            marginBottom: 32,
          }}
        >
          {slide.headline}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 400,
            color: palette.muted,
            lineHeight: 1.5,
          }}
        >
          {slide.sub}
        </div>
      </div>
    </SlideFrame>
  );
}

function CtaSlide({ slide }: { slide: Slide }) {
  return (
    <SlideFrame slide={slide}>
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: palette.primary,
          lineHeight: 1.15,
          marginBottom: 32,
        }}
      >
        {slide.headline}
      </div>
      <div
        style={{
          fontSize: 34,
          fontWeight: 400,
          color: palette.muted,
          lineHeight: 1.4,
          marginBottom: 48,
        }}
      >
        {slide.sub}
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          color: palette.accent,
          letterSpacing: 1,
        }}
      >
        accepted.fyi
      </div>
    </SlideFrame>
  );
}

// --- Props + router ---

export interface CarouselProps {
  slideIndex?: number;
}

export const WaitlistCarouselSlide: React.FC<CarouselProps> = ({
  slideIndex = 1,
}) => {
  const slide = slides.find((s) => s.slide === slideIndex) ?? slides[0];

  switch (slide.type) {
    case "hook":
      return <HookSlide slide={slide} />;
    case "setup":
      return <SetupSlide slide={slide} />;
    case "finding":
      if (slide.chart?.type === "bar") return <BarChartSlide slide={slide} />;
      if (slide.chart?.type === "compare-bar")
        return <CompareBarSlide slide={slide} />;
      if (slide.chart?.key === "cornell")
        return <CornellStatSlide slide={slide} />;
      if (slide.chart?.key === "yaleDartmouth")
        return <ZeroStatSlide slide={slide} />;
      return <MeaningSlide slide={slide} />;
    case "surprise":
      return <SurpriseSlide slide={slide} />;
    case "meaning":
      return <MeaningSlide slide={slide} />;
    case "methodology":
      return <MethodologySlide slide={slide} />;
    case "cta":
      return <CtaSlide slide={slide} />;
    default:
      return <MeaningSlide slide={slide} />;
  }
};

export const totalSlides = slides.length;
