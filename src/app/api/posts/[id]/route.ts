import { NextResponse } from "next/server";

import { postService } from "@/lib/services/post.service";

import {
  getCurrentUser,
  getRouteParamId,
  requireCurrentUser,
} from "@/lib/api/route-utils";

import { handleApiError } from "@/lib/api/handle-api-error";

import { createPostSchema } from "@/lib/validations/post.schema";

const updateSchema = createPostSchema.partial().extend({
  tag_ids:
    createPostSchema.shape.tag_ids
      .optional()
      .nullable() as any,
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = await getRouteParamId(params);

    const viewer = await getCurrentUser();

    const post = await postService.getPostById(
      viewer?.id ?? null,
      id
    );

    return NextResponse.json(post);
  } catch (err) {
    return handleApiError(
      err,
      "GET /api/posts/[id]"
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

    switch (body?.action) {
      case "hide":
        return NextResponse.json(
          await postService.hidePost(
            current.id,
            id
          )
        );

      case "restore":
        return NextResponse.json(
          await postService.restorePost(
            current.id,
            id
          )
        );
    }

    const parsed = updateSchema.parse(body);

    const result = await postService.updatePost(
      current.id,
      id,
      parsed
    );

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(
      err,
      "PATCH /api/posts/[id]"
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

    const result = await postService.deletePost(
      current.id,
      id
    );

    return NextResponse.json(result);
  } catch (err) {
    return handleApiError(
      err,
      "DELETE /api/posts/[id]"
    );
  }
}