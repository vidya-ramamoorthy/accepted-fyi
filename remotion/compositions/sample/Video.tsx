import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

export const BrandPalette = {
  background: "#0f172a",
  primaryText: "#f8fafc",
  secondaryText: "#f1f5f9",
  mutedText: "#94a3b8",
  subtleText: "#64748b",
  accentAccepted: "#22c55e",
  accentRejected: "#ef4444",
  accentWaitlisted: "#f59e0b",
  accentDeferred: "#3b82f6",
} as const;

export type Palette = typeof BrandPalette;

export interface VideoScene {
  id: string;
  startSeconds: number;
  endSeconds: number;
  onScreenText: string;
  voiceover?: string;
  visual: "headline-text" | "bar-chart" | "map" | "stat-block" | "cta";
}

export interface CompositionContent {
  slug: string;
  title: string;
  video: {
    durationSeconds: number;
    scenes: VideoScene[];
  };
}

export const sampleContent: CompositionContent = {
  slug: "sample",
  title: "Sample accepted.fyi video",
  video: {
    durationSeconds: 15,
    scenes: [
      {
        id: "hook",
        startSeconds: 0,
        endSeconds: 3,
        onScreenText: "1,842 California seniors",
        voiceover: "We tracked every California senior in our data.",
        visual: "headline-text",
      },
      {
        id: "reveal",
        startSeconds: 3,
        endSeconds: 10,
        onScreenText: "Here's where they ended up.",
        visual: "bar-chart",
      },
      {
        id: "cta",
        startSeconds: 10,
        endSeconds: 15,
        onScreenText: "Add your result",
        voiceover: "Add yours at accepted dot fyi.",
        visual: "cta",
      },
    ],
  },
};

export const SampleVideo: React.FC<{
  content: CompositionContent;
  palette: Palette;
}> = ({ content, palette }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSecond = frame / fps;
  const scene =
    content.video.scenes.find(
      (s) => currentSecond >= s.startSeconds && currentSecond < s.endSeconds
    ) ?? content.video.scenes[content.video.scenes.length - 1];

  const sceneProgress = interpolate(
    currentSecond,
    [scene.startSeconds, scene.endSeconds],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const fadeIn = interpolate(sceneProgress, [0, 0.15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.background,
        fontFamily: "Inter, sans-serif",
        color: palette.primaryText,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 120,
          opacity: fadeIn,
        }}
      >
        <div
          style={{
            fontSize: scene.visual === "cta" ? 120 : 96,
            fontWeight: 700,
            textAlign: "center",
            lineHeight: 1.1,
            color:
              scene.visual === "cta" ? palette.accentAccepted : palette.primaryText,
          }}
        >
          {scene.onScreenText}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 48,
          right: 48,
          fontSize: 32,
          color: palette.subtleText,
          fontWeight: 400,
        }}
      >
        accepted.fyi
      </div>
    </AbsoluteFill>
  );
};
