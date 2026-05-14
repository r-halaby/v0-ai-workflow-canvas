import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId");
    const key = searchParams.get("key");

    if (!workflowId || !key) {
      return NextResponse.json({ error: "workflowId and key are required" }, { status: 400 });
    }

    const results = await sql`
      SELECT value, data_type FROM workflow_memory
      WHERE workflow_id = ${workflowId} AND key = ${key}
    `;

    if (results.length === 0) {
      return NextResponse.json({ value: null });
    }

    return NextResponse.json({ value: results[0].value, dataType: results[0].data_type });
  } catch (error) {
    console.error("Error reading memory:", error);
    return NextResponse.json({ error: "Failed to read memory" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { workflowId, key, value, dataType } = await request.json();

    if (!workflowId || !key) {
      return NextResponse.json({ error: "workflowId and key are required" }, { status: 400 });
    }

    await sql`
      INSERT INTO workflow_memory (workflow_id, key, value, data_type)
      VALUES (${workflowId}, ${key}, ${value}, ${dataType || "text"})
      ON CONFLICT (workflow_id, key)
      DO UPDATE SET value = ${value}, data_type = ${dataType || "text"}, updated_at = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error writing memory:", error);
    return NextResponse.json({ error: "Failed to write memory" }, { status: 500 });
  }
}
