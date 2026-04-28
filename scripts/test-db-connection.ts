import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const userCount = await prisma.user.count();
  const eventCount = await prisma.event.count();
  console.log(`✓ DB connected. ${userCount} users, ${eventCount} events.`);
}

main()
  .catch((e) => {
    console.error("✗ DB connection failed:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
