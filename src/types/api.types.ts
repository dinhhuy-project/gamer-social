export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: string };

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
};

export type PublicUser = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: "user" | "member" | "admin";
};

export type CurrentUser = PublicUser & {
  email: string;
  coverUrl: string | null;
  bio: string | null;
  isActive: boolean;
  createdAt: string;
};

export type MembershipStatus = {
  isActive: boolean;
  expiresAt: string | null;
  daysLeft: number | null;
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
  createdAt: string;
  updatedAt: string;
  children?: CommentDTO[];
};

export type PostDTO = {
  id: string;
  userId: string;
  author: PublicUser | null;
  postType: "regular" | "marketplace";
  content: string | null;
  mediaUrls: string[];
  status: "active" | "hidden" | "deleted";
  viewCount: number;
  listingPrice: number | null;
  gameName: string | null;
  listingStatus: "pending_review" | "approved" | "rejected" | "sold" | null;
  listingReviewedBy: string | null;
  listingReviewedAt: string | null;
  rejectReason: string | null;
  tagNames: string[];
  createdAt: string;
  updatedAt: string;
};

export type TagDTO = {
  id: number;
  name: string;
  slug: string;
  createdAt: string;
};

export type ReactionType = "like" | "love" | "haha" | "wow" | "sad" | "angry";

export type ReactionCounts = {
  like: number;
  love: number;
  haha: number;
  wow: number;
  sad: number;
  angry: number;
  total: number;
};

export type ReactionTopItem = { type: ReactionType; count: number };

export type ReactionSummaryDTO = {
  targetType: "post" | "comment";
  targetId: string;
  counts: ReactionCounts;
  top: ReactionTopItem[];
  viewerReaction: ReactionType | null;
  engagementScore: number;
};

export type BookmarkStateDTO = { saved: boolean; savedAt: string | null };

export type SavePostResultDTO =
  | { action: "added"; savedAt: string; savedCount: number }
  | { action: "already"; savedAt: string | null; savedCount: number };

export type SavedItemDTO = {
  post: PostDTO;
  savedAt: string;
};

export type ShareStateDTO = { shared: boolean; sharedAt: string | null };

export type PostShareDTO = {
  id: string;
  userId: string;
  user: PublicUser | null;
  note: string | null;
  sharedAt: string;
};
