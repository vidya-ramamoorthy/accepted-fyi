import { Composition, Still } from "remotion";
import { BrandPalette, SampleVideo, sampleContent } from "./compositions/sample/Video";
import { WaitlistVideo, waitlistVideoContent } from "./compositions/waitlist-2026/Video";
import {
  CAROUSEL_HEIGHT,
  CAROUSEL_WIDTH,
  WaitlistCarouselSlide,
  totalSlides,
} from "./compositions/waitlist-2026/Carousel";

const VIDEO_WIDTH = 1080;
const VIDEO_HEIGHT = 1920;
const VIDEO_FPS = 30;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="sample-video"
        component={SampleVideo}
        durationInFrames={VIDEO_FPS * sampleContent.video.durationSeconds}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
        defaultProps={{ content: sampleContent, palette: BrandPalette }}
      />
      <Composition
        id="waitlist-2026"
        component={WaitlistVideo}
        durationInFrames={VIDEO_FPS * waitlistVideoContent.video.durationSeconds}
        fps={VIDEO_FPS}
        width={VIDEO_WIDTH}
        height={VIDEO_HEIGHT}
      />
      {Array.from({ length: totalSlides }, (_, i) => i + 1).map((slideIndex) => (
        <Still
          key={`waitlist-2026-slide-${slideIndex}`}
          id={`waitlist-2026-slide-${slideIndex}`}
          component={WaitlistCarouselSlide}
          width={CAROUSEL_WIDTH}
          height={CAROUSEL_HEIGHT}
          defaultProps={{ slideIndex }}
        />
      ))}
    </>
  );
};
