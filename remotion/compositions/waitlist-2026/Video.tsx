import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import content from "./content.json";

type SceneVisual = "headline-text" | "stat-block" | "cta";

interface Scene {
  id: string;
  startSeconds: number;
  endSeconds: number;
  onScreenText: string;
  voiceover?: string;
  visual: SceneVisual;
}

const palette = content.palette;
const scenes = content.video.scenes as Scene[];

function useCurrentScene(): { scene: Scene; progress: number } {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentSecond = frame / fps;
  const scene =
    scenes.find(
      (s) => currentSecond >= s.startSeconds && currentSecond < s.endSeconds
    ) ?? scenes[scenes.length - 1];
  const progress = interpolate(
    currentSecond,
    [scene.startSeconds, scene.endSeconds],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return { scene, progress };
}

function Watermark() {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 56,
        right: 56,
        fontSize: 36,
        color: palette.subtle,
        fontWeight: 400,
        letterSpacing: 0.5,
      }}
    >
      accepted.fyi
    </div>
  );
}

function HeadlineScene({ text, progress }: { text: string; progress: number }) {
  const fadeIn = interpolate(progress, [0, 0.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(progress, [0, 0.2], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      <div
        style={{
          fontSize: 110,
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.15,
          color: palette.primary,
          opacity: fadeIn,
          transform: `translateY(${translateY}px)`,
          whiteSpace: "pre-wrap",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
}

function StatBlockScene({
  text,
  progress,
}: {
  text: string;
  progress: number;
}) {
  const [labelLine, valueLine] = text.split("\n");
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bounce = spring({
    frame: frame - progress * 0,
    fps,
    config: { damping: 14, stiffness: 90, mass: 0.6 },
  });
  return (
    <AbsoluteFill
      style={{
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      <div
        style={{
          fontSize: 72,
          fontWeight: 700,
          color: palette.muted,
          textAlign: "center",
          marginBottom: 32,
          opacity: interpolate(progress, [0, 0.15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        {labelLine}
      </div>
      <div
        style={{
          fontSize: 180,
          fontWeight: 700,
          color: palette.accent,
          textAlign: "center",
          lineHeight: 1.05,
          transform: `scale(${0.9 + 0.1 * bounce})`,
        }}
      >
        {valueLine}
      </div>
    </AbsoluteFill>
  );
}

function CtaScene({ text, progress }: { text: string; progress: number }) {
  const [line1, line2] = text.split("\n");
  const urlFade = interpolate(progress, [0.2, 0.5], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 120,
      }}
    >
      <div
        style={{
          fontSize: 110,
          fontWeight: 700,
          color: palette.primary,
          textAlign: "center",
          marginBottom: 48,
        }}
      >
        {line1}
      </div>
      <div
        style={{
          fontSize: 140,
          fontWeight: 700,
          color: palette.accent,
          textAlign: "center",
          opacity: urlFade,
          letterSpacing: 1,
        }}
      >
        {line2}
      </div>
    </AbsoluteFill>
  );
}

export const WaitlistVideo: React.FC = () => {
  const { scene, progress } = useCurrentScene();
  let content: React.ReactElement;
  switch (scene.visual) {
    case "stat-block":
      content = <StatBlockScene text={scene.onScreenText} progress={progress} />;
      break;
    case "cta":
      content = <CtaScene text={scene.onScreenText} progress={progress} />;
      break;
    default:
      content = (
        <HeadlineScene text={scene.onScreenText} progress={progress} />
      );
  }
  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.background,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {content}
      <Watermark />
    </AbsoluteFill>
  );
};

export const waitlistVideoContent = content;
