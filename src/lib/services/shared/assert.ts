import { ForbiddenError, NotFoundError, UnauthorizedError } from "./app-error";

export function assertExists<T>(value: T | null | undefined, message = "Not found"): T {
  if (value == null) throw new NotFoundError(message);
  return value;
}

export function assertAuth(userId: string | null | undefined) {
  if (!userId) throw new UnauthorizedError();
}

export function assertRole(role: string | null | undefined, allowed: string[]) {
  if (!role || !allowed.includes(role)) {
    throw new ForbiddenError();
  }
}