import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Get all conversations for the current user/session
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const sessionId = req.cookies.get("sage_session_id")?.value;
  
  const { data: { user } } = await supabase.auth.getUser();
  
  // Build query based on auth status
  let query = supabase
    .from("sage_conversations")
    .select("id, title, created_at, updated_at")
    .order("updated_at", { ascending: false });
  
  if (user) {
    query = query.eq("user_id", user.id);
  } else if (sessionId) {
    query = query.eq("session_id", sessionId);
  } else {
    return NextResponse.json({ conversations: [] });
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ conversations: data || [] });
}

// Create a new conversation
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { title } = await req.json();
  
  const { data: { user } } = await supabase.auth.getUser();
  let sessionId = req.cookies.get("sage_session_id")?.value;
  
  // Generate session ID if not logged in and no session exists
  if (!user && !sessionId) {
    sessionId = crypto.randomUUID();
  }
  
  const { data, error } = await supabase
    .from("sage_conversations")
    .insert({
      title: title || "New Chat",
      user_id: user?.id || null,
      session_id: user ? null : sessionId,
    })
    .select()
    .single();
  
  if (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const response = NextResponse.json({ conversation: data });
  
  // Set session cookie if needed
  if (!user && sessionId) {
    response.cookies.set("sage_session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }
  
  return response;
}
