import { PrismaClient } from "@/generated/prisma/client";
import "dotenv/config";
const prisma = new PrismaClient();

async function main() {
  const tags = [
    { name: "MOBA", slug: "moba" },
    { name: "FPS", slug: "fps" },
    { name: "RPG", slug: "rpg" },
    { name: "Battle Royale", slug: "battle-royale" },
    { name: "MMO", slug: "mmo" },
    { name: "Esports", slug: "esports" },
    { name: "PC Gaming", slug: "pc-gaming" },
    { name: "Mobile", slug: "mobile" },
    { name: "Tips & Tricks", slug: "tips-tricks" },
    { name: "Review", slug: "review" },
  ];
  for (const tag of tags) {
    await prisma.tags.upsert({ where: { slug: tag.slug }, update: {}, create: tag });
  }
  console.log(`Seeded ${tags.length} tags`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
