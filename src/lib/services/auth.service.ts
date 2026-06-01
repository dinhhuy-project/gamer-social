import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { Prisma } from "@/generated/prisma/client";
import { AppError } from "./shared/app-error";
import { assertExists, assertAuth, assertRole } from "./shared/assert";

export type AuthUserDTO = {
  id: string;
  username: string;
  email: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  role: "user" | "member" | "admin";
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  authId?: string | null;
};

function toPublicUser(u: any): AuthUserDTO {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    displayName: u.display_name ?? null,
    avatarUrl: u.avatar_url ?? null,
    role: u.role,
    emailVerified: !!u.email_verified,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
    authId: u.auth_id ?? null,
  };
}

function sanitizeUsername(input: string) {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) ||
    `user${Math.floor(Math.random() * 90000) + 10000}`
  );
}

async function setSupabaseUserMetadata(
  authId: string | undefined,
  internalId: string | undefined,
  role?: "user" | "member" | "admin"
) {
  if (!authId || !internalId) return;
  try {
    // use admin API to persist a mapping so edge middleware can read it from user metadata
    await (supabaseAdmin.auth as any).admin.updateUserById(authId, {
      user_metadata: { internal_user_id: internalId, ...(role ? { role } : {}) },
    });
  } catch (e) {
    // ignore failures to avoid breaking auth flow
  }
}

/**
 * Tìm user theo `auth_id` (Supabase user id)
 */
export async function findUserByAuthId(authId: string) {
  if (!authId) return null;
  const u = await prisma.users.findUnique({ where: { auth_id: authId } });
  return u ? toPublicUser(u) : null;
}

/**
 * Tìm user theo internal id
 */
export async function findUserById(id: string) {
  if (!id) return null;
  const u = await prisma.users.findUnique({ where: { id } });
  return u ? toPublicUser(u) : null;
}

/**
 * Tạo hoặc map user từ Supabase `User` object.
 * - Nếu đã có user với `auth_id` trả về user đó (và sync metadata)
 * - Nếu có user với cùng `email` thì map `auth_id` vào user đó
 * - Nếu không có thì tạo mới user + oauth_providers trong 1 transaction
 */
export async function getOrCreateUserBySupabaseUser(
  supabaseUser: SupabaseUser
) {
  // ensure we have a supabase user id
  assertAuth(supabaseUser?.id);

  // 1) Nếu đã có mapping auth_id -> users
  const existing = await prisma.users.findUnique({ where: { auth_id: supabaseUser.id } });
  if (existing) {
    // sync some fields
    const updated = await prisma.users.update({
      where: { id: existing.id },
      data: {
        email: supabaseUser.email ?? existing.email,
        display_name: supabaseUser.user_metadata?.full_name ?? existing.display_name,
        avatar_url: supabaseUser.user_metadata?.avatar_url ?? existing.avatar_url,
        email_verified: existing.email_verified || !!(supabaseUser as any)["email_confirmed_at"],
      },
    });
    // persist mapping into Supabase user metadata for edge-safe access
    void setSupabaseUserMetadata(supabaseUser.id, updated.id, updated.role);
    return toPublicUser(updated);
  }

  // 2) Nếu có user với cùng email -> map auth_id vào user đó
  const email = supabaseUser.email ?? null;
  if (email) {
    const byEmail = await prisma.users.findUnique({ where: { email } });
    if (byEmail) {
      const updated = await prisma.$transaction(async (tx) => {
        const u = await tx.users.update({
          where: { id: byEmail.id },
          data: {
            auth_id: supabaseUser.id,
            display_name: supabaseUser.user_metadata?.full_name ?? byEmail.display_name,
            avatar_url: supabaseUser.user_metadata?.avatar_url ?? byEmail.avatar_url,
            email_verified: byEmail.email_verified || !!(supabaseUser as any)["email_confirmed_at"],
          },
        });

        try {
          await tx.oauth_providers.create({
            data: {
              user_id: u.id,
              provider: "supabase",
              provider_uid: supabaseUser.id,
            },
          });
        } catch (err) {
          // ignore unique constraint on oauth_providers
        }

        return u;
      });

      // persist mapping into Supabase user metadata for edge-safe access
      void setSupabaseUserMetadata(supabaseUser.id, updated.id, updated.role);
      return toPublicUser(updated);
    }
  }

  // 3) Tạo mới user. Sinh username độc nhất, thử nhiều lần nếu bị conflict
  const display = supabaseUser.user_metadata?.full_name ?? null;
  const base = sanitizeUsername((display ?? supabaseUser.email ?? "user").split("@")[0]);

  let attempt = 0;
  const maxAttempts = 6;
  while (attempt < maxAttempts) {
    const candidate = attempt === 0 ? base : `${base}-${Math.floor(Math.random() * 90000)}`;
    try {
      const created = await prisma.$transaction(async (tx) => {
        const u = await tx.users.create({
          data: {
            username: candidate,
            email: supabaseUser.email ?? `${candidate}@no-email.local`,
            display_name: display,
            avatar_url: supabaseUser.user_metadata?.avatar_url ?? null,
            auth_id: supabaseUser.id,
            email_verified: !!(supabaseUser as any)["email_confirmed_at"],
          },
        });

        try {
          await tx.oauth_providers.create({
            data: {
              user_id: u.id,
              provider: "supabase",
              provider_uid: supabaseUser.id,
            },
          });
        } catch (err) {
          // ignore since provider mapping is optional
        }

        return u;
      });

      // persist mapping into Supabase user metadata for edge-safe access
      void setSupabaseUserMetadata(supabaseUser.id, created.id, created.role);
      return toPublicUser(created);
    } catch (err: any) {
      // Prisma unique constraint error
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        const targets = (err.meta as any)?.target;
        // username conflict -> retry with new candidate
        if (Array.isArray(targets) && targets.includes("username")) {
          attempt++;
          continue;
        }
        // email conflict -> someone else owns this email (race) -> attach auth_id to that user
        if (Array.isArray(targets) && targets.includes("email") && email) {
          const byEmail = await prisma.users.findUnique({ where: { email } });
          if (byEmail) {
            const mapped = await prisma.users.update({
              where: { id: byEmail.id },
              data: { auth_id: supabaseUser.id },
            });
            void setSupabaseUserMetadata(supabaseUser.id, mapped.id, mapped.role);
            return toPublicUser(mapped);
          }
        }
      }

      throw err;
    }
  }

  throw new AppError("Could not create user after multiple attempts", 500, "USER_CREATE_FAILED");
}

/**
 * Lấy current user từ Supabase `User` object (ví dụ: route đã lấy session/user từ Supabase)
 * Nếu chưa có user trong DB thì tạo mới (first sign-in)
 */
export async function getCurrentUserFromSupabaseUser(supabaseUser: SupabaseUser | null) {
  if (!supabaseUser) return null;
  return getOrCreateUserBySupabaseUser(supabaseUser);
}

/**
 * Lấy current user bằng auth id (Supabase id). Hàm này sẽ gọi Supabase Admin để lấy thông tin auth nếu cần.
 */
export async function getCurrentUserByAuthId(authId: string) {
  if (!authId) return null;

  // Try DB first
  const fromDb = await prisma.users.findUnique({ where: { auth_id: authId } });
  if (fromDb) return toPublicUser(fromDb);

  // Fallback: fetch from Supabase Admin and create/map
  try {
    // admin.getUserById is available with service role key
    const resp: any = await (supabaseAdmin.auth as any).admin.getUserById(authId);
    const supaUser: SupabaseUser | null = resp?.data?.user ?? null;
    if (!supaUser) return null;
    return getOrCreateUserBySupabaseUser(supaUser);
  } catch (err) {
    return null;
  }
}

/**
 * Kiểm tra role của user (theo internal `id`).
 * Nếu không thỏa sẽ ném `ForbiddenError`.
 */
export async function requireUserHasRole(id: string, allowed: Array<string>) {
  const u = await prisma.users.findUnique({ where: { id } });
  const user = assertExists(u, "User not found");
  assertRole(user.role, allowed);
  return toPublicUser(user);
}

export const authService = {
  findUserByAuthId,
  findUserById,
  getOrCreateUserBySupabaseUser,
  getCurrentUserFromSupabaseUser,
  getCurrentUserByAuthId,
  requireUserHasRole,
};

export default authService;

