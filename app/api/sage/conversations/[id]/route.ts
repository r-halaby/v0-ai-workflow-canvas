import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Get a specific conversation with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const sessionId = req.cookies.get("sage_session_id")?.value;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get conversation
  let conversationQuery = supabase
    .from("sage_conversations")
    .select("*")
    .eq("id", id);
  
  if (user) {
    conversationQuery = conversationQuery.eq("user_id", user.id);
  } else if (sessionId) {
    conversationQuery = conversationQuery.eq("session_id", sessionId);
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { data: conversation, error: convError } = await conversationQuery.single();
  
  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }
  
  // Get messages
  const { data: messages, error: msgError } = await supabase
    .from("sage_messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });
  
  if (msgError) {
    console.error("Error fetching messages:", msgError);
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }
  
  return NextResponse.json({ 
    conversation, 
    messages: messages || [] 
  });
}

// Update conversation title
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { title } = await req.json();
  const sessionId = req.cookies.get("sage_session_id")?.value;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase
    .from("sage_conversations")
    .update({ title })
    .eq("id", id);
  
  if (user) {
    query = query.eq("user_id", user.id);
  } else if (sessionId) {
    query = query.eq("session_id", sessionId);
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { error } = await query;
  
  if (error) {
    console.error("Error updating conversation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}

// Delete conversation
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const sessionId = req.cookies.get("sage_session_id")?.value;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let query = supabase
    .from("sage_conversations")
    .delete()
    .eq("id", id);
  
  if (user) {
    query = query.eq("user_id", user.id);
  } else if (sessionId) {
    query = query.eq("session_id", sessionId);
  } else {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const { error } = await query;
  
  if (error) {
    console.error("Error deleting conversation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ success: true });
}
