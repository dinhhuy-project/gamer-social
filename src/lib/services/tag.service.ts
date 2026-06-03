import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils/slug";
import { AppError } from "./shared/app-error";
import { assertAuth, assertExists, assertRole } from "./shared/assert";
import type { PaginatedResponse } from "@/types/api.types";
import { Prisma } from "@prisma/client/client";
import type { tagsModel } from "@prisma/client/models/tags";

export type TagDTO = {
  id: number;
  name: string;
  slug: string;
  createdAt: Date;
};

function toTagDTO(t: tagsModel): TagDTO {
  return {
    id: t.id,
    name: t.name,
    slug: t.slug,
    createdAt: t.created_at,
  } as TagDTO;
}

function normalizeName(n: string) {
  return (n ?? "").trim().replace(/\s+/g, " ").slice(0, 100);
}

async function createTagWithUniqueSlug(tx: Prisma.TransactionClient, name: string) {
  const normalized = normalizeName(name);
  if (!normalized) throw new AppError("Tag name is required", 400, "INVALID_INPUT");

  const base = generateSlug(normalized).slice(0, 100) || `tag-${Date.now()}`;
  let slug = base;
  // try until unique (handles concurrent inserts)
  for (let i = 0; i < 10; i += 1) {
    try {
      const created = await tx.tags.create({ data: { name: normalized, slug } });
      return created;
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        // unique constraint violation — check if name already exists
        const existingByName = await tx.tags.findUnique({ where: { name: normalized } });
        if (existingByName) return existingByName;

        // slug conflict: append numeric suffix and retry
        if (/-(\d+)$/.test(slug)) {
          slug = slug.replace(/-(\d+)$/, (_, m) => `${Number(m) + 1}`);
        } else {
          slug = `${base}-2`.slice(0, 100);
        }
        continue;
      }
      throw err;
    }
  }

  // fallback: try a last-resort unique slug
  const fallbackSlug = `${base}-${Math.floor(Math.random() * 100000)}`.slice(0, 100);
  try {
    return await tx.tags.create({ data: { name: normalized, slug: fallbackSlug } });
  } catch (err) {
    throw new AppError("Failed to create tag", 500, "CREATE_FAILED");
  }
}

/**
 * Ensure tags for provided names exist. Returns TagDTO[] in the same order as unique input names.
 * Runs as a single transaction and is safe for concurrent callers.
 */
export async function findOrCreateTagsByNames(names: string[]): Promise<TagDTO[]> {
  if (!Array.isArray(names) || names.length === 0) return [] as TagDTO[];

  const uniqNames = Array.from(new Set(names.map((n) => normalizeName(n)).filter(Boolean)));
  if (uniqNames.length === 0) return [] as TagDTO[];

  const tags = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // precompute slugs to avoid repeated generation
    const pairs = uniqNames.map((n) => ({ name: n, slug: generateSlug(n).slice(0, 100) }));
    const slugs = pairs.map((p) => p.slug);

    // preload existing by name or slug
    const existing = await tx.tags.findMany({ where: { OR: [{ name: { in: uniqNames } }, { slug: { in: slugs } }] } });

    const existingByName = new Map<string, tagsModel>();
    const existingBySlug = new Map<string, tagsModel>();
    for (const e of existing) {
      if (e.name) existingByName.set(e.name, e);
      if (e.slug) existingBySlug.set(e.slug, e);
    }

    const results: tagsModel[] = [];

    for (const p of pairs) {
      const found = existingByName.get(p.name) ?? existingBySlug.get(p.slug);
      if (found) {
        results.push(found);
        continue;
      }

      const created = await createTagWithUniqueSlug(tx, p.name);
      results.push(created);
    }

    return results;
  });

  return tags.map((t: tagsModel) => toTagDTO(t));
}

export async function getTagById(id: number): Promise<TagDTO> {
  const t = assertExists(await prisma.tags.findUnique({ where: { id } }), "Tag not found");
  return toTagDTO(t);
}

export async function getTagBySlug(slug: string): Promise<TagDTO> {
  const t = assertExists(await prisma.tags.findUnique({ where: { slug } }), "Tag not found");
  return toTagDTO(t);
}

export async function listTags(page = 1, perPage = 20, q?: string): Promise<PaginatedResponse<TagDTO>> {
  const take = Math.max(1, Math.min(100, perPage));
  const skip = Math.max(0, (page - 1) * take);

  const where: Prisma.tagsWhereInput = {};
  if (q && q.trim()) {
    where.OR = [{ name: { contains: q } }, { slug: { contains: q } }];
  }

  const [total, recs] = await prisma.$transaction([
    prisma.tags.count({ where }),
    prisma.tags.findMany({ where, skip, take, orderBy: { created_at: "desc" } }),
  ]);

  const data = recs.map((r) => toTagDTO(r));
  const totalPages = Math.ceil(total / take) || 1;

  return {
    data,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  } as PaginatedResponse<TagDTO>;
}

export async function createTag(actorId: string, name: string): Promise<TagDTO> {
  assertAuth(actorId);
  const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");
  // only admin can create tags via this API
  assertRole(actor.role, ["admin"]);

  const created = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // check existing by name first
    const existing = await tx.tags.findUnique({ where: { name: normalizeName(name) } });
    if (existing) throw new AppError("Tag already exists", 400, "ALREADY_EXISTS");

    return await createTagWithUniqueSlug(tx, name);
  });

  return toTagDTO(created);
}

export async function updateTag(actorId: string, id: number, input: { name?: string }): Promise<TagDTO> {
  assertAuth(actorId);
  const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");
  assertRole(actor.role, ["admin"]);

  const existing = assertExists(await prisma.tags.findUnique({ where: { id } }), "Tag not found");

  const updated = await prisma.$transaction(async (tx) => {
    const data: Prisma.tagsUpdateInput = {};
    if (input.name != null) {
      const normalized = normalizeName(input.name);
      if (!normalized) throw new AppError("Invalid tag name", 400, "INVALID_INPUT");
      data.name = normalized;
      data.slug = generateSlug(normalized).slice(0, 100);
    }

    if (Object.keys(data).length === 0) {
      throw new AppError("No changes provided", 400, "INVALID_INPUT");
    }

    try {
      const u = await tx.tags.update({ where: { id }, data });
      return u;
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new AppError("Tag name or slug already exists", 400, "ALREADY_EXISTS");
      }
      throw err;
    }
  });

  return toTagDTO(updated);
}

export async function deleteTag(actorId: string, id: number): Promise<{ id: number }> {
  assertAuth(actorId);
  const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");
  assertRole(actor.role, ["admin"]);

  const existing = assertExists(await prisma.tags.findUnique({ where: { id } }), "Tag not found");

  await prisma.$transaction(async (tx) => {
    await tx.tags.delete({ where: { id } });
  });

  return { id };
}

export const tagService = {
  findOrCreateTagsByNames,
  getTagById,
  getTagBySlug,
  listTags,
  createTag,
  updateTag,
  deleteTag,
};

export default tagService;

