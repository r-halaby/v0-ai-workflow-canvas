import { NextResponse } from "next/server";
import * as fal from "@fal-ai/serverless-client";

// Configure fal client
fal.config({
  credentials: process.env.FAL_KEY,
});

export async function POST(request: Request) {
  try {
    const { prompt, sourceImageUrl, count = 1, variations } = await request.json();
    const imageCount = Math.min(variations || count, 4);

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Generate all images in parallel using fal.ai's fast Flux Schnell model
    const generationPromises = Array.from({ length: imageCount }, async (_, index) => {
      // Add slight variation to prompt for each image
      const variedPrompt = imageCount > 1 
        ? `${prompt}. Variation ${index + 1}, unique perspective and composition.`
        : prompt;

      const result = await fal.subscribe("fal-ai/flux/schnell", {
        input: {
          prompt: `Create a professional mockup: ${variedPrompt}. High quality, photorealistic rendering.`,
          image_size: "landscape_16_9",
          num_inference_steps: 4,
          num_images: 1,
        },
      }) as { images?: Array<{ url: string }> };

      return result.images?.[0]?.url;
    });

    // Wait for all images to generate in parallel
    const imageUrls = await Promise.all(generationPromises);
    
    // Filter out any failed generations and format response
    const images = imageUrls
      .filter((url): url is string => !!url)
      .map(url => ({ url }));

    if (images.length === 0) {
      return NextResponse.json(
        { error: "Failed to generate any images" },
        { status: 500 }
      );
    }

    return NextResponse.json({ images });
  } catch (error) {
    console.error("Mockup generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate mockups" },
      { status: 500 }
    );
  }
}
