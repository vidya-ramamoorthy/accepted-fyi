import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getVisibleSubmissionById } from "@/lib/db/queries/submissions";
import DecisionCardLayout from "@/components/cards/DecisionCardLayout";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

async function loadFont(filename: string): Promise<ArrayBuffer> {
  const fontPath = join(process.cwd(), "public", "fonts", filename);
  const buffer = await readFile(fontPath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!UUID_REGEX.test(id)) {
      return new Response("Invalid submission ID", { status: 400 });
    }

    const submission = await getVisibleSubmissionById(id);

    if (!submission) {
      return new Response("Submission not found", { status: 404 });
    }

    const size = request.nextUrl.searchParams.get("size");
    const isStory = size === "story";
    const width = isStory ? STORY_WIDTH : OG_WIDTH;
    const height = isStory ? STORY_HEIGHT : OG_HEIGHT;

    const [interBold, interRegular] = await Promise.all([
      loadFont("Inter-Bold.ttf"),
      loadFont("Inter-Regular.ttf"),
    ]);

    const imageResponse = new ImageResponse(
      <DecisionCardLayout
        data={{
          schoolName: submission.schoolName,
          schoolState: submission.schoolState,
          schoolCity: submission.schoolCity,
          schoolWebsite: submission.schoolWebsite,
          decision: submission.decision,
          applicationRound: submission.applicationRound,
          admissionCycle: submission.admissionCycle,
          intendedMajor: submission.intendedMajor,
        }}
        variant={isStory ? "story" : "og"}
      />,
      {
        width,
        height,
        fonts: [
          { name: "Inter", data: interBold, weight: 700, style: "normal" },
          { name: "Inter", data: interRegular, weight: 400, style: "normal" },
        ],
      }
    );

    imageResponse.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );

    return imageResponse;
  } catch (error) {
    console.error("OG card generation failed:", error);
    return new Response("Card generation failed", { status: 500 });
  }
}
