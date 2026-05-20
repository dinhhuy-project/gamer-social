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
