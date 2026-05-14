import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// POST - Accept an invitation
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Please sign in to accept this invitation" }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Invitation token required" }, { status: 400 });
    }

    // Get the invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("workspace_invitations")
      .select("*, workspaces(name)")
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    // Check if invitation is still valid
    if (invitation.status !== "pending") {
      return NextResponse.json({ error: `This invitation has been ${invitation.status}` }, { status: 400 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabase
        .from("workspace_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);
      return NextResponse.json({ error: "This invitation has expired" }, { status: 400 });
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", invitation.workspace_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "You are already a member of this workspace" }, { status: 400 });
    }

    // Add user as member
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: invitation.workspace_id,
        user_id: user.id,
        role: invitation.role,
      });

    if (memberError) {
      console.error("Error adding member:", memberError);
      return NextResponse.json({ error: "Failed to join workspace" }, { status: 500 });
    }

    // Mark invitation as accepted
    await supabase
      .from("workspace_invitations")
      .update({ 
        status: "accepted",
        accepted_at: new Date().toISOString()
      })
      .eq("id", invitation.id);

    return NextResponse.json({ 
      success: true,
      workspaceId: invitation.workspace_id,
      workspaceName: invitation.workspaces?.name || "Workspace"
    });
  } catch (error) {
    console.error("Accept invitation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Get invitation details by token (for preview before accepting)
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: invitation, error } = await supabase
      .from("workspace_invitations")
      .select("id, email, role, status, expires_at, workspaces(id, name)")
      .eq("token", token)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    // Check expiry
    const isExpired = new Date(invitation.expires_at) < new Date();

    return NextResponse.json({
      invitation: {
        ...invitation,
        isExpired,
        isValid: invitation.status === "pending" && !isExpired
      }
    });
  } catch (error) {
    console.error("Get invitation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
