import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { reactionService } from "@/lib/services/reaction.service";
import { authService } from "@/lib/services/index";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";
import { reactionSchema } from "@/lib/validations/reaction.schema";

type RouteContext = {
  params?: Promise<{ id?: string }> | { id?: string };
};

async function resolveId(
  request: Request,
  context: RouteContext,
  segment: "posts" | "comments"
) {
  const params = await context.params;
  const id = params?.id;

  if (id) return id;

  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const index = parts.findIndex((part) => part === segment);

  if (index >= 0 && parts[index + 1]) {
    return parts[index + 1];
  }

  return undefined;
}

async function getOptionalViewer() {
  const supabase = await createClient();
  const response = await supabase.auth.getUser();

  if (response.error || !response.data.user) {
    return null;
  }

  return authService.getCurrentUserFromSupabaseUser(response.data.user);
}

async function getRequiredViewer() {
  const supabase = await createClient();
  const response = await supabase.auth.getUser();

  if (response.error || !response.data.user) {
    return null;
  }

  return authService.getCurrentUserFromSupabaseUser(response.data.user);
}

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    const id = await resolveId(request, context, "posts");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const viewer = await getOptionalViewer();
    const summary = await reactionService.getPostReactionsSummary(
      id,
      viewer?.id ?? null
    );

    return NextResponse.json(summary);
  } catch (err) {
    console.error("GET /api/posts/[id]/reactions error:", err);

    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: RouteContext
) {
  try {
    const id = await resolveId(request, context, "posts");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const current = await getRequiredViewer();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = reactionSchema.parse(body);

    const res = await reactionService.reactToPost(current.id, id, parsed.type);

    return NextResponse.json(res);
  } catch (err) {
    console.error("POST /api/posts/[id]/reactions error:", err);

    if (err instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: err.issues },
        { status: 400 }
      );
    }

    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext
) {
  try {
    const id = await resolveId(request, context, "posts");

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const current = await getRequiredViewer();

    if (!current) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deleted = await reactionService.removeReactionFromPost(current.id, id);

    return NextResponse.json(deleted);
  } catch (err) {
    console.error("DELETE /api/posts/[id]/reactions error:", err);

    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }

    if (err instanceof AppError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
