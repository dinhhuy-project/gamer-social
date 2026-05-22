// src/types/post.types.ts
// Shared types cho toàn bộ components/post/

export type PostAuthor = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: "user" | "member" | "admin";
};

export type PostTag = {
  tag: {
    id: number;
    name: string;
    slug: string;
  };
};

export type PostCounts = {
  reactions: number;
  comments: number;
};

export type PostMedia = {
  url: string;
  type: "image" | "video";
};

export type Post = {
  id: string;
  postType: "regular" | "marketplace";
  content: string | null;
  mediaUrls: string[];
  status: "active" | "hidden" | "deleted";
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
  postTags: PostTag[];
  _count: PostCounts;
  // Marketplace fields
  listingPrice?: number | null;
  gameName?: string | null;
  listingStatus?: "pending_review" | "approved" | "rejected" | "sold" | null;
};

// Reaction state (optimistic UI)
export type ReactionState = {
  count: number;
  hasReacted: boolean;
};
