import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { authService } from "@/lib/services/index";
import { postService } from "@/lib/services/post.service";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user: supaUser },
      error,
    } = await supabase.auth.getUser();

    let viewer = null;

    if (!error && supaUser) {
      viewer =
        await authService.getCurrentUserFromSupabaseUser(
          supaUser
        );
    }

    const state =
      await postService.getShareState(
        viewer?.id ?? null,
        id
      );

    return NextResponse.json(state);
  } catch (err: any) {
    console.error(
      "GET /api/posts/[id]/share error:",
      err
    );

    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: err.message },
        { status: 404 }
      );
    }

    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user: supaUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supaUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const current =
      await authService.getCurrentUserFromSupabaseUser(
        supaUser
      );

    if (!current) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const result =
      await postService.sharePost(
        current.id,
        id,
        body.note
      );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error(
      "POST /api/posts/[id]/share error:",
      err
    );

    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: err.message },
        { status: 404 }
      );
    }

    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Missing id" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user: supaUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supaUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const current =
      await authService.getCurrentUserFromSupabaseUser(
        supaUser
      );

    if (!current) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const result =
      await postService.unsharePost(
        current.id,
        id
      );

    return NextResponse.json(result);
  } catch (err: any) {
    console.error(
      "DELETE /api/posts/[id]/share error:",
      err
    );

    if (err instanceof NotFoundError) {
      return NextResponse.json(
        { error: err.message },
        { status: 404 }
      );
    }

    if (err instanceof AppError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}