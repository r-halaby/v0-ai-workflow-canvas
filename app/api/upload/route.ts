import { put, del } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";
import { SUPPORTED_EXTENSIONS } from "@/lib/atlas-types";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get file extension
    const fileName = file.name;
    const lastDotIndex = fileName.lastIndexOf(".");
    const extension = lastDotIndex !== -1 ? fileName.slice(lastDotIndex).toLowerCase() : "";

    // Validate file extension
    if (!SUPPORTED_EXTENSIONS.includes(extension as any)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${extension}. Supported types: ${SUPPORTED_EXTENSIONS.join(", ")}` },
        { status: 400 }
      );
    }

    // Upload to Vercel Blob with public access
    const blob = await put(`atlas/${Date.now()}-${fileName}`, file, {
      access: "public",
    });

    return NextResponse.json({
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      fileName: fileName,
      extension: extension,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    await del(url);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
