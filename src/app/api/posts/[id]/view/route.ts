import { NextResponse } from "next/server";

import { postService } from "@/lib/services/post.service";
import {
  AppError,
  NotFoundError,
} from "@/lib/services/shared/app-error";

export async function POST(_request: Request, { params }: any) {
  try {
    const { id } = await params;

    const result =
      await postService.incrementViewCount(id);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    console.error(error);

    return NextResponse.json(
      {
        error: "Internal Server Error",
      },
      {
        status: 500,
      }
    );
  }
}