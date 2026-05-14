import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function getSQL() {
  const databaseUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or NEON_DATABASE_URL is not configured");
  }
  return neon(databaseUrl);
}

export async function GET() {
  try {
    const sql = getSQL();
    const workflows = await sql`
      SELECT id, name, description, created_at, updated_at
      FROM workflows
      ORDER BY updated_at DESC
    `;
    return NextResponse.json({ workflows });
  } catch (error) {
    console.error("Error fetching workflows:", error);
    return NextResponse.json({ error: "Failed to fetch workflows" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sql = getSQL();
    const { name, description, nodes, edges } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO workflows (name, description, nodes, edges)
      VALUES (${name}, ${description || null}, ${JSON.stringify(nodes)}, ${JSON.stringify(edges)})
      RETURNING id, name, description, created_at, updated_at
    `;

    return NextResponse.json({ workflow: result[0] });
  } catch (error) {
    console.error("Error creating workflow:", error);
    return NextResponse.json({ error: "Failed to create workflow" }, { status: 500 });
  }
}
