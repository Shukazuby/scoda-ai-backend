import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LangChainService {
  constructor(private readonly configService: ConfigService) { }

  /**
   * Detect platform and content-type hints from the topic so we can restrict
   * generated ideas to the user's specified platform/format when present.
   */
  private detectTopicFocus(topic: string): {
    platforms: string[];
    formats: string[];
  } {
    const t = topic.toLowerCase();
    const platformMap: { keyword: string; label: string }[] = [
      { keyword: "instagram", label: "Instagram" },
      { keyword: "tiktok", label: "TikTok" },
      { keyword: "youtube", label: "YouTube" },
      { keyword: "linkedin", label: "LinkedIn" },
      { keyword: "twitter", label: "Twitter/X" },
      { keyword: " x ", label: "Twitter/X" },
      { keyword: "facebook", label: "Facebook" },
    ];
    const formatMap: { keyword: string; label: string }[] = [
      { keyword: "reel", label: "Video" },
      { keyword: "reels", label: "Video" },
      { keyword: "carousel", label: "Carousel" },
      { keyword: "video", label: "Video" },
      { keyword: "short", label: "Short" },
      { keyword: "story", label: "Story" },
      { keyword: "stories", label: "Story" },
      { keyword: "photo", label: "Photo" },
      { keyword: "graphic", label: "Graphics" },
    ];
    const platforms = platformMap
      .filter(({ keyword }) => t.includes(keyword))
      .map(({ label }) => label);
    const formats = formatMap
      .filter(({ keyword }) => t.includes(keyword))
      .map(({ label }) => label);
    const uniquePlatforms = Array.from(new Set(platforms));
    const uniqueFormats = Array.from(new Set(formats));
    return { platforms: uniquePlatforms, formats: uniqueFormats };
  }

  async generateIdeas(topic: string): Promise<{
    nodes: any[];
    edges: any[];
    metadata: { topic: string; generatedAt: string; version: string };
  }> {
    const apiKey = this.configService.get<string>("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    const { platforms: topicPlatforms, formats: topicFormats } =
      this.detectTopicFocus(topic);
    const hasPlatformFocus = topicPlatforms.length > 0;
    const hasFormatFocus = topicFormats.length > 0;
    const focusInstruction =
      hasPlatformFocus || hasFormatFocus
        ? `
IMPORTANT - The topic explicitly mentions preferred channel or content type:
${hasPlatformFocus ? `- Generate ideas ONLY for these platforms: ${topicPlatforms.join(", ")}.` : ""}
${hasFormatFocus ? `- Generate ideas ONLY for these content types: ${topicFormats.join(", ")}.` : ""}
Do not mix in other platforms or formats; stick to what the user asked for.
`
        : `
- Mix different platforms (Instagram, TikTok, YouTube, LinkedIn, Twitter/X, Facebook) and content types (graphics, carousel, video, photo, short, story).
`;

    const prompt = `
You are Scoda AI, an elite AI content strategist, digital marketer, and digital content creator.

Your mission:
Generate a **week's worth of content plans** (at least 7 strong ideas) for the topic below.
Each plan should feel like a standalone, publish‑ready idea.

You must:
- Think like a senior content strategist, senior digital marketer and senior digital content creator
- Break the topic into interesting angles and create a content plan for each angle
- Ensure ideas are original and non-generic
- Avoid repetition and fluff
- Make ideas practical and execution-ready
- Create a content plan for each angle
${focusInstruction}
CRITICAL FOR VIDEO / REEL IDEAS:
- Many ideas should be best suited for Instagram or TikTok video / reels.
- For each such video/reel idea you MUST also generate a short script (see below).

FORMAT RULES (STRICT):

PART 1 - Numbered ideas:
- First, output a numbered list. Each item MUST be exactly one line.
- Each line MUST follow: "<Title> - <Description>"
- Title = short, punchy, under 80 characters.
- Description = detailed explanation (caption, script hint, or talking point). One line only.

PART 2 - Video scripts (only for video/reel/short ideas):
- After the numbered list, add a blank line, then the line: VIDEO SCRIPTS:
- For each idea that is a video/reel/short-style idea (by its number N), output a block exactly like this (one block per video idea, in order by N):

N: HOOK: <one line - the opening hook, specific to this idea>
SCENE 1: <one line - what happens in scene 1>
SCENE 2: <one line - what happens in scene 2>
SCENE 3: <one line - what happens in scene 3>
CTA: <one line - call to action>

- Replace N with the idea number (1, 2, 3...). Generate creative, specific script lines for that idea—not generic text. No blank line between the "N:" line and HOOK/SCENE/CTA lines; one blank line after each block before the next "N:".
- Skip non-video ideas (e.g. carousel, static graphic). Only output blocks for ideas that are video/reel/short.

DO NOT:
- Add commentary or markdown outside the format above
- Add explanations before or after the list
- Mention "pillars" or "steps"

Topic: ${topic}
`;

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorBody = await res.text();
        console.error(
          "Gemini API error:",
          res.status,
          res.statusText,
          errorBody
        );
        throw new Error(
          `Gemini API error ${res.status} ${res.statusText}: ${errorBody}`
        );
      }

      const data: any = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || "")
          .join("\n") ?? "";

      if (!text) {
        throw new Error("Gemini returned an empty response");
      }

      // Split response: idea list (before VIDEO SCRIPTS) and optional script blocks (after).
      const videoScriptsMarker = /^\s*VIDEO SCRIPTS\s*:\s*$/im;
      const parts = text.split(videoScriptsMarker);
      const ideaListText = parts[0].trim();
      const scriptsSection = parts[1]?.trim() ?? "";

      const ideaListLines = ideaListText
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);
      const numbered = ideaListLines.filter((l) => /^\d+[\).\s]/.test(l));
      const ideaLines = numbered.length > 0 ? numbered : ideaListLines;

      // Parse VIDEO SCRIPTS section: blocks like "N: HOOK: ..." then "SCENE 1: ..." etc.
      const scriptsByIdeaNumber: Record<number, string> = {};
      const scriptBlockStart = /^(\d+):\s*HOOK:\s*/i;
      const scriptLines = scriptsSection.split("\n");
      let currentNum: number | null = null;
      let currentBlock: string[] = [];
      for (const line of scriptLines) {
        const match = line.match(scriptBlockStart);
        if (match) {
          if (currentNum !== null && currentBlock.length > 0) {
            scriptsByIdeaNumber[currentNum] = currentBlock.join("\n").trim();
          }
          currentNum = parseInt(match[1], 10);
          currentBlock = [line];
        } else if (currentNum !== null && line.length > 0) {
          currentBlock.push(line);
        }
      }
      if (currentNum !== null && currentBlock.length > 0) {
        scriptsByIdeaNumber[currentNum] = currentBlock.join("\n").trim();
      }

      const allPlatforms = [
        "Instagram",
        "TikTok",
        "YouTube",
        "LinkedIn",
        "Twitter/X",
        "Facebook",
      ];
      const allFormats = [
        "Carousel",
        "Video",
        "Photo",
        "Short",
        "Story",
        "Graphics",
      ];
      const platforms =
        topicPlatforms.length > 0 ? topicPlatforms : allPlatforms;
      const formats = topicFormats.length > 0 ? topicFormats : allFormats;

      const nodes = ideaLines.map((line, index) => {
        const cleaned = line.replace(/^\d+[\).\s]*/, "").trim();

        // Split into <Title> - <Description>
        const [rawLabel, rawDesc] = cleaned.split(" - ", 2);
        const labelText = (rawLabel || "").trim();
        const descText = (rawDesc || "").trim();

        const label =
          labelText.length > 80
            ? labelText.slice(0, 77).trimEnd() + "..."
            : labelText || `Idea ${index + 1}`;

        // Simple heuristic: first few ideas are "main", then "sub", then "related"
        let type: "main" | "sub" | "related" = "sub";
        if (index === 0) type = "main";
        else if (index === 1 || index === 2) type = "sub";
        else type = "related";

        // Pick a platform and content type (format) for this idea.
        const platform = platforms[index % platforms.length];
        const format = formats[index % formats.length];

        const isVideoLikePlatform =
          /instagram|tiktok/i.test(platform) &&
          /video|short|story/i.test(format);

        const description =
          descText || cleaned || `Generated idea ${index + 1} for ${topic}.`;

        const ideaNumber = index + 1;
        const script: string | undefined =
          isVideoLikePlatform && scriptsByIdeaNumber[ideaNumber]
            ? scriptsByIdeaNumber[ideaNumber]
            : undefined;

        return {
          id: `idea-${index + 1}`,
          label,
          description,
          platform,
          format,
          script,
          type,
        };
      });

      const edges =
        nodes.length > 1
          ? nodes.slice(1).map((node, idx) => ({
            id: `edge-${idx + 1}`,
            source: "idea-1",
            target: node.id,
            type: idx < 2 ? ("hierarchical" as const) : ("related" as const),
          }))
          : [];

      return {
        nodes,
        edges,
        metadata: {
          topic,
          generatedAt: new Date().toISOString(),
          version: "2.5-gemini",
        },
      };
    } catch (error) {
      console.error("Error generating ideas with Gemini HTTP API:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed");
    }
  }
}
