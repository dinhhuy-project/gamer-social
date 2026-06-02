import { NextResponse } from "next/server";
import { userService } from "@/lib/services/user.service";
import { postService } from "@/lib/services/post.service";
import { AppError } from "@/lib/services/shared/app-error";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim() ?? "";

    if (!q) {
      return NextResponse.json({ users: [], posts: [] });
    }

    const [users, posts] = await Promise.all([
      userService.listUsers(1, 5, q),
      postService.listPosts(null, 1, 5, false, undefined, q),
    ]);

    return NextResponse.json({
      users: users.data,
      posts: posts.data,
    });
  } catch (err: any) {
    console.error("GET /api/search error:", err);
    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
