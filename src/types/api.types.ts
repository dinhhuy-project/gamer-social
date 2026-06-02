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

export type GlobalSearchResult = {
  users: PublicUser[];
  posts: PostDTO[];
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

export type UserRole = "user" | "member" | "admin";

export type AdminUserListItem = {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  postsCount: number;
  createdAt: string;
  lastSeenAt: string | null;
};

export type AdminUserDetail = AdminUserListItem & {
  coverUrl: string | null;
  bio: string | null;
  followersCount: number;
  followingCount: number;
  marketplaceListingsCount: number;
};

export type AdminUsersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type AdminUsersResponse = {
  users: AdminUserListItem[];
  pagination: AdminUsersPagination;
};

export type PostType = "regular" | "marketplace";
export type PostStatus = "active" | "hidden" | "deleted";
export type ListingStatus = "pending_review" | "approved" | "rejected" | "sold";

export type AdminPostAuthor = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  role: UserRole;
};

export type AdminPostListItem = {
  id: string;
  author: AdminPostAuthor;
  contentPreview: string | null;
  mediaCount: number;
  mediaUrls: string[];
  tags: string[];
  postType: PostType;
  status: PostStatus;
  listingStatus: ListingStatus | null;
  gameName: string | null;
  listingPrice: number | null;
  createdAt: string;
  reactionsCount: number;
  commentsCount: number;
};

export type AdminPostDetail = AdminPostListItem & {
  content: string | null;
  viewCount: number;
  listingReviewedBy: string | null;
  listingReviewedAt: string | null;
  rejectReason: string | null;
  reactionsSummary: Record<string, number>;
};

export type AdminPostsPagination = AdminUsersPagination;

export type AdminPostsResponse = {
  posts: AdminPostListItem[];
  pagination: AdminPostsPagination;
};
