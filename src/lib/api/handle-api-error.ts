import { NextResponse } from "next/server";
import { AppError, NotFoundError } from "@/lib/services/shared/app-error";

export function handleApiError(
  err: unknown,
  routeName: string
) {
  console.error(routeName, err);

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

  if (err instanceof Error) {
    if (err.message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (err.message === "Missing id") {
      return NextResponse.json(
        { error: err.message },
        { status: 400 }
      );
    }
  }

  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  );
}