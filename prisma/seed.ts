import { PrismaClient, post_type, reaction_type, user_role } from "@/generated/prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  // =========================
  // POSTS
  // =========================

  const posts = [
    {
      user_id: "da901989-3c03-475f-9bf7-5d90e08a83ab",
      post_type: post_type.regular,
      content:
        "Just reached Immortal rank in Valorant 🔥",
      game_name: "Valorant",
      media_urls: [
        "https://images.unsplash.com/photo-1542751371-adc38448a05e",
      ],
    },
    {
      user_id: "da901989-3c03-475f-9bf7-5d90e08a83ab",
      post_type: post_type.marketplace,
      content:
        "Selling Diamond League of Legends account with 120 skins.",
      game_name: "League of Legends",
      listing_price: 250,
      media_urls: [
        "https://images.unsplash.com/photo-1511512578047-dfb367046420",
      ],
    },
    {
      user_id: "da901989-3c03-475f-9bf7-5d90e08a83ab",
      post_type: post_type.regular,
      content:
        "Best crosshair settings for competitive FPS games.",
      game_name: "CS2",
    },
  ];

  const createdPosts = [];

  for (const post of posts) {
    const created = await prisma.posts.create({
      data: {
        ...post,
        listing_price: post.listing_price
          ? Number(post.listing_price)
          : null,
      },
    });

    createdPosts.push(created);
  }

  console.log(`Seeded ${createdPosts.length} posts`);

  // =========================
  // POST TAGS
  // =========================

  const allTags = await prisma.tags.findMany();

  await prisma.post_tags.createMany({
    data: [
      {
        post_id: createdPosts[0].id,
        tag_id: allTags.find((t) => t.slug === "fps")!.id,
      },
      {
        post_id: createdPosts[0].id,
        tag_id: allTags.find((t) => t.slug === "esports")!.id,
      },
      {
        post_id: createdPosts[1].id,
        tag_id: allTags.find((t) => t.slug === "moba")!.id,
      },
      {
        post_id: createdPosts[2].id,
        tag_id: allTags.find((t) => t.slug === "tips-tricks")!.id,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seeded post tags");

  // =========================
  // COMMENTS
  // =========================

  const comment1 = await prisma.comments.create({
    data: {
      post_id: createdPosts[0].id,
      user_id: "875a461c-8044-4642-b9c2-e2211eacac79",
      content: "Congrats bro 🔥",
    },
  });

  await prisma.comments.create({
    data: {
      post_id: createdPosts[0].id,
      user_id: "da901989-3c03-475f-9bf7-5d90e08a83ab",
      parent_id: comment1.id,
      content: "Thanks man ❤️",
    },
  });

  console.log("Seeded comments");

  // =========================
  // REACTIONS
  // =========================

  await prisma.reactions.create({
    data: {
      user_id: "875a461c-8044-4642-b9c2-e2211eacac79",
      post_id: createdPosts[0].id,
      type: reaction_type.like,
    },
  });

  await prisma.reactions.create({
    data: {
      user_id: "d98df0b2-54f9-43de-835c-530a069d20bb",
      comment_id: comment1.id,
      type: reaction_type.love,
    },
  });

  console.log("Seeded reactions");

  console.log("✅ Database seeded successfully");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });