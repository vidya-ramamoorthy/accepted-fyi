import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const SLUG = process.argv[2] ?? "waitlist-2026";
const TOTAL_SLIDES = 10;
const OUT_DIR = join(process.cwd(), "out", SLUG);

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log(`Bundling Remotion project...`);
  const serveUrl = await bundle({
    entryPoint: join(process.cwd(), "remotion/index.ts"),
    webpackOverride: (config) => config,
  });

  console.log(`Rendering ${TOTAL_SLIDES} slides for ${SLUG} to ${OUT_DIR}`);

  for (let slideIndex = 1; slideIndex <= TOTAL_SLIDES; slideIndex++) {
    const compositionId = `${SLUG}-slide-${slideIndex}`;
    const outputPath = join(
      OUT_DIR,
      `slide-${String(slideIndex).padStart(2, "0")}.png`
    );

    const composition = await selectComposition({
      serveUrl,
      id: compositionId,
      inputProps: { slideIndex },
    });

    await renderStill({
      composition,
      serveUrl,
      output: outputPath,
      inputProps: { slideIndex },
      imageFormat: "png",
    });

    console.log(`  ✓ slide ${slideIndex} → ${outputPath}`);
  }

  console.log(`\nDone. ${TOTAL_SLIDES} PNGs written to ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
