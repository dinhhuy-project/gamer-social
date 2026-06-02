import { prisma } from "@/lib/prisma";
import type { CurrentUser } from "@/types/current-user";

export async function findByAuthId(authId: string): Promise<CurrentUser | null> {
  if (!authId) return null;
  const u = await prisma.users.findUnique({ where: { auth_id: authId } });
  if (!u) return null;
  return {
    id: u.id,
    authId: u.auth_id!,
    username: u.username,
    displayName: u.display_name ?? u.username,
    avatarUrl: u.avatar_url ?? null,
  };
}

export async function findById(userId: string): Promise<CurrentUser | null> {
  if (!userId) return null;
  const u = await prisma.users.findUnique({ where: { id: userId } });
  if (!u) return null;
  if (!u.auth_id) return null; // mapped application user must have an auth_id to be used as CurrentUser
  return {
    id: u.id,
    authId: u.auth_id,
    username: u.username,
    displayName: u.display_name ?? u.username,
    avatarUrl: u.avatar_url ?? null,
  };
}

export const userResolverService = {
  findByAuthId,
  findById,
};

export default userResolverService;
