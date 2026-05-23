import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { userService } from "@/lib/services/user.service";
import { authService } from "@/lib/services/index";
import { followService } from "@/lib/services/follow.service";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";

export async function GET(
  _request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    if (!username) return NextResponse.json({ error: "Missing username" }, { status: 400 });

    // optional auth to compute `isFollowing` for the viewer
    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;

    let viewer: any = null;
    if (!error && supaUser) {
      viewer = await authService.getCurrentUserFromSupabaseUser(supaUser);
    }

    const profile = await userService.getPublicProfileByUsernameOrDisplayName(username, viewer?.id);
    return NextResponse.json(profile);
  } catch (err: any) {
    console.error("GET /api/users/[username]/follow error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    if (!username) return NextResponse.json({ error: "Missing username" }, { status: 400 });

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // ensure target exists and get id
    const target = await userService.getPublicProfileByUsernameOrDisplayName(username);

    const result = await followService.followUser(current.id, target.id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("POST /api/users/[username]/follow error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;
    if (!username) return NextResponse.json({ error: "Missing username" }, { status: 400 });

    const supabase = await createClient();
    const resp = await supabase.auth.getUser();
    const supaUser = resp?.data?.user ?? null;
    const error = resp?.error ?? null;
    if (error || !supaUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const current = await authService.getCurrentUserFromSupabaseUser(supaUser);
    if (!current) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

    // ensure target exists and get id
    const target = await userService.getPublicProfileByUsernameOrDisplayName(username);

    const result = await followService.unfollowUser(current.id, target.id);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("DELETE /api/users/[username]/follow error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

