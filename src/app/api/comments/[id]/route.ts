import { NextResponse } from "next/server";

import { commentService } from "@/lib/services/comment.service";

import {
  getCurrentUser,
  getRouteParamId,
  requireCurrentUser,
} from "@/lib/api/route-utils";

import { handleApiError } from "@/lib/api/handle-api-error";

import { createCommentSchema } from "@/lib/validations/comment.schema";

const updateSchema = createCommentSchema.pick({
  content: true,
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getRouteParamId(params);

    const viewer = await getCurrentUser();

    const comment = await commentService.getCommentById(
      viewer?.id ?? null,
      id
    );

    return NextResponse.json(comment);
  } catch (err) {
    return handleApiError(
      err,
      "GET /api/comments/[id]"
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getRouteParamId(params);

    const current = await requireCurrentUser();

    const body = await request.json();

    const parsed = updateSchema.parse(body);

    const updated =
      await commentService.updateComment(
        current.id,
        id,
        {
          content: parsed.content,
        }
      );

    return NextResponse.json(updated);
  } catch (err) {
    return handleApiError(
      err,
      "PATCH /api/comments/[id]"
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getRouteParamId(params);

    const current = await requireCurrentUser();

    const deleted =
      await commentService.deleteComment(
        current.id,
        id
      );

    return NextResponse.json(deleted);
  } catch (err) {
    return handleApiError(
      err,
      "DELETE /api/comments/[id]"
    );
  }
}

