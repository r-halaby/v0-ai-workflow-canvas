import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt, sourceImageUrl, count = 1, variations } = await request.json();
    const imageCount = variations || count;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const generatedImages: Array<{ base64: string; mediaType: string }> = [];

    // Generate mockups using Nano Banana 2 (google/gemini-3.1-flash-image-preview)
    for (let i = 0; i < Math.min(imageCount, 4); i++) {
      const messages: Array<{ role: "user"; content: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> }> = [];
      
      // Build the message content
      const content: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> = [];
      
      // Add source image if provided and valid
      if (sourceImageUrl) {
        try {
          // Handle different URL formats
          let imageUrl: URL;
          if (sourceImageUrl.startsWith('data:')) {
            // Skip data URLs for now - AI SDK may not support them directly as URL
            // We'll just use the prompt without the source image
          } else if (sourceImageUrl.startsWith('http://') || sourceImageUrl.startsWith('https://')) {
            imageUrl = new URL(sourceImageUrl);
            content.push({
              type: "image",
              image: imageUrl,
            });
          } else if (sourceImageUrl.startsWith('/')) {
            // Relative URL - prepend the host
            const host = request.headers.get('host') || 'localhost:3000';
            const protocol = request.headers.get('x-forwarded-proto') || 'https';
            imageUrl = new URL(sourceImageUrl, `${protocol}://${host}`);
            content.push({
              type: "image",
              image: imageUrl,
            });
          }
        } catch (urlError) {
          console.error("Invalid source image URL:", sourceImageUrl, urlError);
          // Continue without the source image rather than failing completely
        }
      }
      
      content.push({
        type: "text",
        text: sourceImageUrl 
          ? `Based on this image, create a new mockup variation: ${prompt}. Generate a high-quality mockup image.`
          : `Create a mockup image: ${prompt}. Generate a high-quality mockup image.`,
      });
      
      messages.push({ role: "user", content });

      const result = await generateText({
        model: gateway("google/gemini-3.1-flash-image-preview"),
        messages,
        providerOptions: {
          google: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        },
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
