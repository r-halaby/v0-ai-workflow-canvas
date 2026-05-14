import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const history = await sql`
      SELECT id, workflow_id, status, final_output, started_at, completed_at
      FROM workflow_executions
      WHERE workflow_id = ${id}
      ORDER BY started_at DESC
      LIMIT 20
    `;

    return NextResponse.json({ history });
  } catch (error) {
    console.error("Failed to fetch run history:", error);
    return NextResponse.json(
      { error: "Failed to fetch run history" },
      { status: 500 }
    );
  }
}
