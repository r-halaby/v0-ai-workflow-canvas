import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Save messages to a conversation
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  const supabase = await createClient();
  const { messages } = await req.json();
  const sessionId = req.cookies.get("sage_session_id")?.value;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Verify conversation ownership
  let verifyQuery = supabase
    .from("sage_conversations")
    .select("id")
    .eq("id", conversationId);
  
  if (user) {
    verifyQuery = verifyQuery.eq("user_id", user.id);
  } else if (sessionId) {
    verifyQuery = verifyQuery.eq("session_id", sessionId);
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { data: conversation, error: verifyError } = await verifyQuery.single();
  
  if (verifyError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  
  // Prepare messages for insert
  const messagesToInsert = messages.map((msg: { id?: string; role: string; content?: string; parts?: unknown[] }) => ({
    conversation_id: conversationId,
    role: msg.role,
    content: msg.content || (msg.parts?.filter((p: unknown) => (p as { type: string }).type === "text").map((p: unknown) => (p as { text: string }).text).join("") || ""),
    parts: msg.parts || null,
  }));
  
  const { error } = await supabase
    .from("sage_messages")
    .insert(messagesToInsert);
  
  if (error) {
    console.error("Error saving messages:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
