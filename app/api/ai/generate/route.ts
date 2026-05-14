import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { provider, model, prompt, systemPrompt, temperature } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Map provider to model string for AI Gateway
    const modelMap: Record<string, string> = {
      openai: `openai/${model || "gpt-4o"}`,
      google: `google/${model || "gemini-2.0-flash"}`,
      xai: `xai/${model || "grok-3"}`,
    };

    const modelString = modelMap[provider] || "openai/gpt-4o";

    const { text } = await generateText({
      model: modelString,
      prompt,
      system: systemPrompt || undefined,
      temperature: temperature ?? 0.7,
    });

    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
