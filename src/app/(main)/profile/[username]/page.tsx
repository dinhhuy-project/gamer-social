"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PostCard } from "@/components/post/PostCard";
import FollowButton from "@/components/profile/FollowButton";
import { useCurrentUser } from "@/hooks/auth/useCurrentUser";
import { usePosts } from "@/hooks/posts/usePosts";
import { useStartConversation } from "@/hooks/chat/useStartConversation";
import { useUser } from "@/hooks/users/useUser";
import { ROUTES } from "@/lib/constants/routes";

type Props = {
  params: Promise<{ username: string }>;
};

const Stat = ({ label, value }: { label: string; value: string | number }) => {
  return (
    <div className="rounded border border-border p-3 text-center bg-card">
      <div className="text-2xl font-semibold text-card-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

export default function ProfilePage({ params }: Props) {
  const router = useRouter();
  const { username } = use(params);
  const currentUserQuery = useCurrentUser();
  const profileQuery = useUser(username);
  const profile = profileQuery.data;
  const isOwner = Boolean(currentUserQuery.data && profile && currentUserQuery.data.id === profile.id);
  const { startConversation, isStarting } = useStartConversation(isOwner ? undefined : profile?.id);

  const postsQuery = usePosts(1, 10, false, profile?.id, Boolean(profile?.id));
  const posts = postsQuery.data?.data ?? [];

  const displayName = profile?.displayName ?? username;
  const avatar = profile?.avatarUrl ?? "/images/fiery_magma_dragon.png";
  const cover = profile?.coverUrl ?? avatar;
  const bio = profile?.bio ?? "Chưa có bio.";

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-lg bg-card border border-border" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-lg bg-card border border-border" />
          ))}
        </div>
      </div>
    );
  }

  if (profileQuery.isError) {
    return (
      <div className="rounded-lg border border-red-500/40 bg-card p-6 text-sm text-red-300">
        {profileQuery.error.message}
      </div>
    );
  }

  const handleStartConversation = async () => {
    if (!profile?.id) return;
    if (!currentUserQuery.data) {
      router.push(ROUTES.login);
      return;
    }
    if (currentUserQuery.data.id === profile.id) return;

    try {
      const conversation = await startConversation();
      if (conversation?.id) {
        router.push(ROUTES.conversation(conversation.id));
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card">
          <div
            className="h-44 bg-cover bg-center"
            style={{ backgroundImage: `url(${cover})` }}
          />

          <div className="p-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start">
              <div className="-mt-6 shrink-0">
                <div className="rounded-full p-1 bg-gradient-to-tr from-amber-400 via-pink-500 to-cyan-400">
                  <Image src={avatar} alt={displayName} width={112} height={112} className="rounded-full border-4 border-card" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-card-foreground">{displayName}</h2>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{bio}</p>
                  </div>

                  {isOwner ? (
                    <Link
                      href={ROUTES.settings}
                      className="inline-flex items-center justify-center rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-black"
                    >
                      Chỉnh sửa hồ sơ
                    </Link>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      <FollowButton username={username} />
                      <button
                        type="button"
                        disabled={isStarting}
                        onClick={handleStartConversation}
                        className="inline-flex items-center justify-center rounded border border-border bg-card px-4 py-2 text-sm font-semibold text-card-foreground transition hover:border-amber-400/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isStarting ? "Đang mở..." : "Message"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Followers" value={profile?.followersCount ?? 0} />
                  <Stat label="Following" value={profile?.followingCount ?? 0} />
                  <Stat label="Shared posts" value={profile?.sharedPostsCount ?? 0} />
                  <Stat label="All posts" value={profile?.postsCount ?? 0} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="mb-4 border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-semibold text-card-foreground">Posts của {displayName}</h3>
          </div>

          {postsQuery.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-lg bg-zinc-900" />
              ))}
            </div>
          ) : postsQuery.isError ? (
            <div className="rounded-lg border border-red-500/40 bg-zinc-950 p-4 text-sm text-red-300">
              {postsQuery.error.message}
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Chưa có bài post nào để hiển thị.
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post as any}
                  hasReacted={false}
                  isSaved={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="text-sm font-semibold text-card-foreground">Tóm tắt</h3>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Username</span>
              <span className="font-medium text-card-foreground">{profile?.username ?? username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Email</span>
              <span className="font-medium text-card-foreground">{currentUserQuery.data?.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Role</span>
              <span className="font-medium text-card-foreground">{profile?.role ?? "user"}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

