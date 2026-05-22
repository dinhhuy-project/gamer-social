import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppError } from "./shared/app-error";
import { assertAuth, assertExists, assertRole } from "./shared/assert";
import type { PublicUser, PaginatedResponse } from "@/types/api.types";

export type CreateCommentInput = {
  content: string;
  parentId?: string | null;
};

export type UpdateCommentInput = {
  content: string;
};

export type CommentDTO = {
  id: string;
  postId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isDeleted: boolean;
  author: PublicUser | null;
  replyCount: number;
  createdAt: Date;
  updatedAt: Date;
  children?: CommentDTO[];
};

function toPublicUser(u: any): PublicUser | null {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name ?? null,
    avatarUrl: u.avatar_url ?? null,
    role: u.role,
  } as PublicUser;
}

function sanitizeContent(s: string) {
  return (s ?? "").trim().slice(0, 2000);
}

function extractMentions(text: string) {
  const set = new Set<string>();
  if (!text) return [] as string[];
  // usernames: letters, numbers, underscore, dash
  const re = /@([a-zA-Z0-9_\-]+)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m[1]) set.add(m[1]);
  }
  return Array.from(set);
}

function mapCommentRecordToDTO(c: any, replyCount = 0): CommentDTO {
  return {
    id: c.id,
    postId: c.post_id,
    userId: c.user_id,
    parentId: c.parent_id ?? null,
    content: c.content,
    isDeleted: !!c.is_deleted,
    author: toPublicUser(c.users ?? null),
    replyCount,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

/** Build nested tree from flat comment list (children attach to parent). */
export function buildCommentTree(flat: CommentDTO[]) {
  const map = new Map<string, CommentDTO>();
  const roots: CommentDTO[] = [];
  for (const c of flat) {
    map.set(c.id, { ...c, children: [] });
  }

  for (const c of map.values()) {
    if (c.parentId) {
      const p = map.get(c.parentId);
      if (p) p.children!.push(c);
      else roots.push(c); // orphan child
    } else {
      roots.push(c);
    }
  }

  return roots;
}

/** Anti-spam checks: simple rate limit rules */
async function assertNotSpamming(userId: string) {
  // allow at most 3 comments in last 15 seconds
  const windowMs = 15_000;
  const limit = 3;
  const since = new Date(Date.now() - windowMs);
  const recent = await prisma.comments.count({ where: { user_id: userId, created_at: { gte: since } } });
  if (recent >= limit) throw new AppError("Rate limit exceeded", 429, "TOO_MANY_REQUESTS");
}

export async function createComment(actorId: string, postId: string, input: CreateCommentInput) {
  assertAuth(actorId);

  const content = sanitizeContent(input.content || "");
  if (!content) throw new AppError("Content is required", 400, "INVALID_INPUT");

  const post = assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  // simple permission: hidden/deleted posts are only visible to owner/admin
  if (post.status !== "active") {
    if (post.user_id !== actorId) {
      const viewer = await prisma.users.findUnique({ where: { id: actorId } });
      if (!viewer || viewer.role !== "admin") throw new AppError("Cannot comment on this post", 404, "NOT_FOUND");
    }
  }

  await assertNotSpamming(actorId);

  let parent: any = null;
  if (input.parentId) {
    parent = await prisma.comments.findUnique({ where: { id: input.parentId } });
    if (!parent) throw new AppError("Parent comment not found", 400, "INVALID_PARENT");
    if (parent.post_id !== postId) throw new AppError("Parent comment belongs to different post", 400, "INVALID_PARENT");
  }

  // create inside transaction: comment + notifications
  const created = await prisma.$transaction(async (tx) => {
    const c = await tx.comments.create({
      data: {
        post_id: postId,
        user_id: actorId,
        parent_id: input.parentId ?? null,
        content,
      },
      include: { users: true },
    });

    // notify post owner if commenter isn't the post owner
    try {
      if (post.user_id !== actorId) {
        await tx.notifications.create({
          data: {
            user_id: post.user_id,
            type: "post_comment",
            title: null,
            body: null,
            data: { postId, commentId: c.id },
          },
        });
      }
    } catch {
      // ignore notification failures
    }

    // notify parent comment owner (reply)
    try {
      if (parent && parent.user_id !== actorId) {
        await tx.notifications.create({
          data: {
            user_id: parent.user_id,
            type: "comment_reply",
            title: null,
            body: null,
            data: { postId, commentId: c.id, parentId: parent.id },
          },
        });
      }
    } catch {
      // ignore
    }

    // mentions (best-effort)
    try {
      const mentioned = extractMentions(content);
      if (mentioned.length) {
        const users = await tx.users.findMany({ where: { username: { in: mentioned } } });
        for (const u of users) {
          if (u.id === actorId) continue;
          try {
            await tx.notifications.create({
              data: {
                user_id: u.id,
                type: parent ? "comment_reply" : "post_comment",
                title: null,
                body: null,
                data: { postId, commentId: c.id },
              },
            });
          } catch {
            // ignore
          }
        }
      }
    } catch { }

    return c;
  });

  // best-effort realtime / admin hooks
  try {
    void supabaseAdmin; // placeholder to indicate server-side admin client available
  } catch {
    // ignore
  }

  // compute reply count for the created comment (usually 0)
  const dto = await mapCommentRecordToDTO(created, 0);
  return dto;
}

export async function updateComment(actorId: string, commentId: string, input: UpdateCommentInput) {
  assertAuth(actorId);

  const existing = assertExists(await prisma.comments.findUnique({ where: { id: commentId } }), "Comment not found");

  if (existing.user_id !== actorId) {
    const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");
    assertRole(actor.role, ["admin"]);
  }

  const content = sanitizeContent(input.content || "");
  if (!content) throw new AppError("Content is required", 400, "INVALID_INPUT");

  const updated = await prisma.$transaction(async (tx) => {
    const c = await tx.comments.update({ where: { id: commentId }, data: { content, updated_at: new Date() }, include: { users: true } });

    // mentions on update (best-effort)
    try {
      const mentioned = extractMentions(content);
      if (mentioned.length) {
        const users = await tx.users.findMany({ where: { username: { in: mentioned } } });
        for (const u of users) {
          if (u.id === actorId) continue;
          try {
            await tx.notifications.create({ data: { user_id: u.id, type: "comment_reply", title: null, body: null, data: { postId: c.post_id, commentId: c.id } } });
          } catch { }
        }
      }
    } catch { }

    return c;
  });

  return mapCommentRecordToDTO(updated, 0);
}

export async function deleteComment(actorId: string, commentId: string) {
  assertAuth(actorId);

  const existing = assertExists(await prisma.comments.findUnique({ where: { id: commentId } }), "Comment not found");

  if (existing.user_id !== actorId) {
    const actor = assertExists(await prisma.users.findUnique({ where: { id: actorId } }), "Actor not found");
    assertRole(actor.role, ["admin"]);
  }

  // soft-delete so we can restore or audit
  const deleted = await prisma.comments.update({ where: { id: commentId }, data: { is_deleted: true, updated_at: new Date() }, include: { users: true } });

  return mapCommentRecordToDTO(deleted, 0);
}

/** Paginated list of root comments for a post with immediate children included (best-effort). */
export async function listComments(
  viewerId: string | null | undefined,
  postId: string,
  page = 1,
  perPage = 20,
  repliesPerRoot = 3
) {
  const take = Math.max(1, Math.min(100, perPage));
  const skip = Math.max(0, (page - 1) * take);

  const post = assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  // visibility check: reuse same logic as posts
  if (post.status !== "active") {
    if (!viewerId || viewerId !== post.user_id) {
      const viewer = viewerId ? await prisma.users.findUnique({ where: { id: viewerId } }) : null;
      if (!viewer || viewer.role !== "admin") throw new AppError("Not found", 404, "NOT_FOUND");
    }
  }

  const [total, roots] = await prisma.$transaction([
    prisma.comments.count({ where: { post_id: postId, parent_id: null, is_deleted: false } }),
    prisma.comments.findMany({
      where: { post_id: postId, parent_id: null, is_deleted: false },
      include: { users: true },
      orderBy: { created_at: "desc" },
      skip,
      take,
    }),
  ]);

  const rootIds = roots.map((r) => r.id);

  const replies = rootIds.length
    ? await prisma.comments.findMany({ where: { post_id: postId, parent_id: { in: rootIds }, is_deleted: false }, include: { users: true }, orderBy: { created_at: "asc" } })
    : [];

  // group replies by parent
  const byParent = new Map<string, any[]>();
  for (const r of replies) {
    const arr = byParent.get(r.parent_id!) ?? [];
    arr.push(r);
    byParent.set(r.parent_id!, arr);
  }

  const dtos: CommentDTO[] = [];

  for (const root of roots) {
    const childRows = byParent.get(root.id) ?? [];
    const childDtos = childRows.slice(0, repliesPerRoot).map((c) => ({
      id: c.id,
      postId: c.post_id,
      userId: c.user_id,
      parentId: c.parent_id ?? null,
      content: c.content,
      isDeleted: !!c.is_deleted,
      author: toPublicUser(c.users ?? null),
      replyCount: 0,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    } as CommentDTO));

    const replyCount = childRows.length;

    const rootDto: CommentDTO = {
      id: root.id,
      postId: root.post_id,
      userId: root.user_id,
      parentId: root.parent_id ?? null,
      content: root.content,
      isDeleted: !!root.is_deleted,
      author: toPublicUser(root.users ?? null),
      replyCount,
      createdAt: root.created_at,
      updatedAt: root.updated_at,
      children: childDtos,
    };

    dtos.push(rootDto);
  }

  const totalPages = Math.ceil(total / take) || 1;

  return {
    data: dtos,
    total,
    page,
    totalPages,
    hasMore: page < totalPages,
  } as PaginatedResponse<CommentDTO>;
}

export async function listCommentTree(viewerId: string | null | undefined, postId: string) {
  const post = assertExists(await prisma.posts.findUnique({ where: { id: postId } }), "Post not found");

  if (post.status !== "active") {
    if (!viewerId || viewerId !== post.user_id) {
      const viewer = viewerId ? await prisma.users.findUnique({ where: { id: viewerId } }) : null;
      if (!viewer || viewer.role !== "admin") throw new AppError("Not found", 404, "NOT_FOUND");
    }
  }

  const comments = await prisma.comments.findMany({
    where: { post_id: postId, is_deleted: false },
    include: { users: true },
    orderBy: { created_at: "asc" },
  });

  const replyCountMap = new Map<string, number>();
  for (const comment of comments) {
    if (comment.parent_id) {
      replyCountMap.set(comment.parent_id, (replyCountMap.get(comment.parent_id) ?? 0) + 1);
    }
  }

  const dtos = comments.map((comment) =>
    mapCommentRecordToDTO(comment, replyCountMap.get(comment.id) ?? 0)
  );

  return buildCommentTree(dtos);
}

/** List replies for a single comment */
export async function listReplies(parentCommentId: string, page = 1, perPage = 50) {
  const take = Math.max(1, Math.min(200, perPage));
  const skip = Math.max(0, (page - 1) * take);

  await assertExists(await prisma.comments.findUnique({ where: { id: parentCommentId } }), "Parent comment not found");

  const [total, rows] = await prisma.$transaction([
    prisma.comments.count({ where: { parent_id: parentCommentId, is_deleted: false } }),
    prisma.comments.findMany({ where: { parent_id: parentCommentId, is_deleted: false }, include: { users: true }, orderBy: { created_at: "asc" }, skip, take }),
  ]);

  const data = await Promise.all(rows.map((r) => mapCommentRecordToDTO(r, 0)));
  const totalPages = Math.ceil(total / take) || 1;

  return { data, total, page, totalPages, hasMore: page < totalPages } as PaginatedResponse<CommentDTO>;
}

export async function countCommentsForPost(postId: string) {
  return prisma.comments.count({ where: { post_id: postId, is_deleted: false } });
}

export async function getCommentById(viewerId: string | null | undefined, commentId: string) {
  const c = assertExists(
    await prisma.comments.findUnique({ where: { id: commentId }, include: { users: true } }),
    "Comment not found"
  );

  // If comment is deleted, only owner or admin can view
  if (c.is_deleted) {
    if (!viewerId || viewerId !== c.user_id) {
      const viewer = viewerId ? await prisma.users.findUnique({ where: { id: viewerId } }) : null;
      if (!viewer || viewer.role !== "admin") throw new AppError("Not found", 404, "NOT_FOUND");
    }
  }

  // check post visibility
  const post = assertExists(await prisma.posts.findUnique({ where: { id: c.post_id } }), "Post not found");
  if (post.status !== "active") {
    if (!viewerId || viewerId !== post.user_id) {
      const viewer = viewerId ? await prisma.users.findUnique({ where: { id: viewerId } }) : null;
      if (!viewer || viewer.role !== "admin") throw new AppError("Not found", 404, "NOT_FOUND");
    }
  }

  const replyCount = await prisma.comments.count({ where: { parent_id: commentId, is_deleted: false } });
  return mapCommentRecordToDTO(c, replyCount);
}

export const commentService = {
  createComment,
  updateComment,
  deleteComment,
  listComments,
  listCommentTree,
  listReplies,
  getCommentById,
  buildCommentTree,
  countCommentsForPost,
};

export default commentService;

