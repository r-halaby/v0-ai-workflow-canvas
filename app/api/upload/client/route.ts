import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userPrefix = user?.id || "anonymous";

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Generate a client token for the browser to upload the file
        return {
          allowedContentTypes: [
            "image/jpeg",
            "image/png", 
            "image/gif",
            "image/webp",
            "image/avif",
            "application/pdf",
            "application/vnd.figma",
            "video/mp4",
            "video/quicktime",
            "application/zip",
            "application/x-zip-compressed",
          ],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          addRandomSuffix: true, // Allow duplicate filenames by adding random suffix
          tokenPayload: JSON.stringify({
            userId: user?.id || "anonymous",
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This runs after the file is uploaded to Blob storage
        console.log("Upload completed:", blob.pathname);
        
        try {
          const payload = JSON.parse(tokenPayload || "{}");
          
          // Optionally save to database
          if (payload.userId && payload.userId !== "anonymous") {
            const supabase = await createClient();
            await supabase.from("files").insert({
              user_id: payload.userId,
              file_name: blob.pathname.split("/").pop() || "unknown",
              file_type: blob.contentType,
              file_size: 0, // Size not available in this callback
              blob_url: blob.url,
              metadata: {
                pathname: blob.pathname,
                contentType: blob.contentType,
              },
            });
          }
        } catch (error) {
          console.error("Error in onUploadCompleted:", error);
        }
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Client upload error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
