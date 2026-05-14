import { generateText } from "ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, sourceImageUrl, count = 1 } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const generatedImages: Array<{ base64: string; mediaType: string }> = [];

    // Generate mockups using Nano Banana 2 (google/gemini-3.1-flash-image-preview)
    for (let i = 0; i < Math.min(count, 4); i++) {
      const messages: Array<{ role: "user"; content: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> }> = [];
      
      // Build the message content
      const content: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> = [];
      
      // Add source image if provided
      if (sourceImageUrl) {
        content.push({
          type: "image",
          image: new URL(sourceImageUrl),
        });
      }
      
      content.push({
        type: "text",
        text: sourceImageUrl 
          ? `Based on this image, create a new mockup variation: ${prompt}. Generate a high-quality mockup image.`
          : `Create a mockup image: ${prompt}. Generate a high-quality mockup image.`,
      });
      
      messages.push({ role: "user", content });

      const result = await generateText({
        model: "google/gemini-3.1-flash-image-preview",
        messages,
      });

      // Extract generated images from the result
      if (result.files) {
        for (const file of result.files) {
          if (file.mediaType?.startsWith("image/") && file.base64) {
            generatedImages.push({
              base64: file.base64,
              mediaType: file.mediaType,
            });
          }
        }
      }
    }

    return NextResponse.json({
      images: generatedImages,
      count: generatedImages.length,
    });
  } catch (error) {
    console.error("Mockup generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Mockup generation failed" },
      { status: 500 }
    );
  }
}
