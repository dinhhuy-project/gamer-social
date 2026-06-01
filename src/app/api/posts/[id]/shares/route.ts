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

    const url = new URL(request.url);

    const page =
      Number(url.searchParams.get("page")) || 1;

    const perPage =
      Number(url.searchParams.get("perPage")) || 20;

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

    await postService.getPostById(
      viewer?.id ?? null,
      id
    );

    const shares =
      await postService.listPostShares(
        viewer?.id ?? null,
        id,
        page,
        perPage
      );

    return NextResponse.json(shares);
  } catch (err) {
    console.error("GET /api/posts/[id]/shares error:", err);
    if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.statusCode });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
