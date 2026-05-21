import Image from "next/image";
import React from "react";

type Props = {
  params: { username: string };
};

const Stat = ({ label, value }: { label: string; value: string | number }) => {
  return (
    <div className="rounded border border-border p-3 text-center bg-card">
      <div className="text-2xl font-semibold text-card-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

const PostCard = ({ post }: { post: any }) => {
  return (
    <article className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-start gap-4">
        <Image src={post.avatar} alt="avatar" width={44} height={44} className="rounded-full" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold">{post.author}</div>
              <div className="text-xs text-muted-foreground">{post.time} • {post.context}</div>
            </div>
            <div className="text-muted-foreground">•••</div>
          </div>

          <p className="mt-3 text-sm text-muted-foreground">{post.text}</p>

          {post.image && (
            <div className="mt-3 rounded overflow-hidden">
              <Image src={post.image} alt="post" width={900} height={400} className="w-full h-auto rounded-md" />
            </div>
          )}

          <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
            <div>👍 {post.likes.toLocaleString()}</div>
            <div>💬 {post.comments}</div>
            <div>Share</div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default function ProfilePage({ params }: Props) {
  const username = params?.username ?? "CyberPhantom_99";

  const user = {
    displayName: username,
    bio:
      "Competitive FPS enthusiast and aspiring strategy analyst. Currently grinding rank in 'Ether Wars'. Founder of the @NeonVanguard community. Always looking for a solid duo.",
    hoursPlayed: 2482,
    accountLevel: 142,
    trophies: 315,
    globalRank: "#1,104",
    avatar: "/images/fiery_magma_dragon.png",
    cover: "/images/fiery_magma_dragon.png",
  };

  const posts = [
    {
      id: "1",
      author: user.displayName,
      avatar: user.avatar,
      time: "2 hours ago",
      context: "in Ether Wars",
      text: "Just hit Platinum in the new season! The mid-lane meta is wild right now. Who else is climbing the ladder tonight? 🔥",
      image: "/images/fiery_magma_dragon.png",
      likes: 1200,
      comments: 48,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="relative rounded-lg overflow-hidden bg-card border border-border">
          <div
            className="h-44 bg-cover bg-center"
            style={{ backgroundImage: `url(${user.cover})` }}
          />

          <div className="p-6 -mt-16">
            <div className="flex items-start gap-6">
              <div className="-mt-6">
                <div className="rounded-full p-1 bg-gradient-to-tr from-amber-400 via-pink-500 to-cyan-400">
                  <Image src={user.avatar} alt={user.displayName} width={112} height={112} className="rounded-full border-4 border-card" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-card-foreground">{user.displayName}</h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">{user.bio}</p>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-4 py-2 rounded bg-amber-500 text-black font-semibold">Follow</button>
                    <button className="px-4 py-2 rounded border border-border text-sm">Message</button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Stat label="Hours Played" value={user.hoursPlayed} />
                  <Stat label="Account Level" value={user.accountLevel} />
                  <Stat label="Trophies Earned" value={user.trophies} />
                  <Stat label="Global Rank" value={user.globalRank} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <nav className="flex gap-4 border-b border-zinc-800 pb-3 mb-4">
            <a className="text-sm font-medium border-b-2 border-amber-500 pb-2">Posts</a>
            <a className="text-sm text-muted-foreground">Achievements</a>
            <a className="text-sm text-muted-foreground">Collection</a>
            <a className="text-sm text-muted-foreground">Friends</a>
          </nav>

          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 text-card-foreground">Recently Played</h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src={user.avatar} alt="Cyber Siege" width={48} height={48} className="rounded" />
                <div>
                  <div className="font-medium text-card-foreground">Cyber Siege</div>
                  <div className="text-xs text-muted-foreground">32 hours • Level 85</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">›</div>
            </li>

            <li className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src={user.avatar} alt="Ether Wars" width={48} height={48} className="rounded" />
                <div>
                  <div className="font-medium text-card-foreground">Ether Wars</div>
                  <div className="text-xs text-muted-foreground">1,128 hours • Diamond Rank</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">›</div>
            </li>
          </ul>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-3 text-card-foreground">Communities</h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded bg-zinc-900 text-sm">#NeonVanguard</span>
            <span className="px-3 py-1 rounded bg-zinc-900 text-sm">#FPS_Elite</span>
            <span className="px-3 py-1 rounded bg-zinc-900 text-sm">#Strategy_Masters</span>
          </div>
        </div>
      </aside>
    </div>
  );
}

