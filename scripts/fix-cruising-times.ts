import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const events = await prisma.cruisingEvent.findMany({
    select: { id: true, title: true, date: true },
    orderBy: { date: "asc" },
  });

  console.log(`Found ${events.length} cruising events`);

  let fixed = 0;
  for (const event of events) {
    const d = event.date;
    const isMidnightUtc =
      d.getUTCHours() === 0 &&
      d.getUTCMinutes() === 0 &&
      d.getUTCSeconds() === 0;

    if (!isMidnightUtc) {
      console.log(`  ✓ ${event.title}: ${d.toISOString()} (skipping, has time)`);
      continue;
    }

    const newDate = new Date(
      d.getUTCFullYear(),
      d.getUTCMonth(),
      d.getUTCDate(),
      18,
      0,
      0
    );

    await prisma.cruisingEvent.update({
      where: { id: event.id },
      data: { date: newDate },
    });

    console.log(
      `  → ${event.title}: ${d.toISOString()} → ${newDate.toISOString()} (18:00 lokal)`
    );
    fixed++;
  }

  console.log(`\nDone! Updated ${fixed} of ${events.length} events.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
