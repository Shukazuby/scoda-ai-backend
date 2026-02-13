import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LangChainService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Call the Gemini HTTP API directly (no Google SDK) to generate ideas
   * and convert the response into an IdeaGraph-shaped object.
   */
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

//     const prompt = `
// You are an expert content strategist and idea generation specialist.

// Your job is to generate structured, creative, and practical content plans based on a given topic.

// You must:
// - Think strategically
// - Organize ideas clearly
// - Avoid fluff
// - Avoid repetition
// - Ensure ideas are actionable

// Format for each idea:
// - Return a numbered list.
// - Each item MUST be exactly one line in this format:
//   "<Title> - <Description>"
// - Title: a short, catchy label for the idea.
// - Description: a richer piece of content that could be used directly
//   as a caption, video or voiceover script, or any other content that helps
//   the user talk about the topic. It can be multiple sentences.

// Do NOT include any extra commentary or markdown, just the numbered lines.

// Topic: ${topic}
// `;

    // ✅ Use a currently supported model name
   
    const prompt = `
You are ScodAI, an elite AI content strategist and idea graph architect.

Your mission:
Generate a **week's worth of content plans** (at least 7-14 strong ideas) for the topic below.
Each plan should feel like a standalone, publish‑ready idea.

You must:
- Think like a senior content strategist
- Break the topic into interesting angles
- Ensure ideas are original and non-generic
- Avoid repetition and fluff
- Make ideas practical and execution-ready
${focusInstruction}
CRITICAL FOR VIDEO / REEL IDEAS:
- Many ideas should be best suited for Instagram or TikTok video / reels.
- For those ideas, the description MUST read like a clear example script and
  explain how the video should look and flow (HOOK, scenes, B‑roll, on‑screen text).
- Explicitly highlight the structure of the script in the description text so it
  can be spotted easily (e.g. "HOOK:", "SCENE 1:", "B‑ROLL:", "CTA:").

FORMAT RULES (STRICT):

- Return ONLY a numbered list.
- Each item MUST be exactly one line.
- Each line MUST follow this format:

"<Title> - <Description>"

Where:
- Title = short, punchy, under 80 characters.
- Description = detailed explanation that could be directly used
  as a caption, script, or talking point. It can be multiple sentences
  but MUST remain on the same line.

DO NOT:
- Add commentary
- Add markdown
- Add explanations
- Mention "pillars" or "steps"
- Add blank lines

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

      // Convert the numbered list into IdeaGraph nodes/edges
      const lines = text
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);

      // Prefer lines starting with a number, but fall back to all non-empty lines.
      const numbered = lines.filter((l) => /^\d+[\).\s]/.test(l));
      const ideaLines = numbered.length > 0 ? numbered : lines;

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

        // If this looks like a video/reel idea (Instagram/TikTok + Video/Short/Story),
        // generate an example script outline from the description.
        const isVideoLikePlatform =
          /instagram|tiktok/i.test(platform) &&
          /video|short|story/i.test(format);

        let script: string | undefined;
        if (isVideoLikePlatform) {
          script = [
            `HOOK: ${label}`,
            "",
            `SCENE 1: On-screen text with the main hook while you appear on camera introducing the idea.`,
            `SCENE 2: B‑roll or screen recording that visually demonstrates the key point(s).`,
            `SCENE 3: Close‑up shot summarising the main takeaway in one sentence.`,
            `CTA: Ask viewers to comment their experience with "${topic}" or save the video for later.`,
          ].join("\n");
        }

        return {
          id: `idea-${index + 1}`,
          label,
          // If model didn't follow the "<Title> - <Description>" format,
          // fall back to using the full cleaned line as the description.
          description:
            descText ||
            cleaned ||
            `Generated idea ${index + 1} for ${topic}.`,
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
      throw new Error("");
    }
  }
}
