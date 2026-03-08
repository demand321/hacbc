import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.event.findMany({ select: { title: true } });
  console.log("Existing events:", existing.map((e) => e.title));

  const newEvents = [
    {
      title: "Klubbkveld",
      description:
        "Klubbkveld på Vandrerhjemmet. Planleggingsmøte for SommerTreffet 2026 kl 17:00.",
      date: new Date("2026-03-12T18:00:00"),
      location: "Vandrerhjemmet v/Vikingskipet, Hamar",
      address: "Åkersvikveien 24, 2321 Hamar",
      lat: 60.7945,
      lng: 11.068,
      isPublished: true,
    },
    {
      title: "Doorslammers 2025",
      description: "Doorslammers treff. En klassisk samling for amerikanske biler.",
      date: new Date("2025-05-03T12:00:00"),
      location: "Vandrerhjemmet, Hamar",
      address: "Åkersvikveien 24, 2321 Hamar",
      imageUrl: "/images/events/doorslammers.jpeg",
      isPublished: true,
    },
    {
      title: "HACBC Treff 2025",
      description: "HACBC treff på Vandrerhjemmet. Utstilling og sosialt samvær.",
      date: new Date("2025-06-28T13:00:00"),
      location: "Vandrerhjemmet, Hamar",
      address: "Åkersvikveien 24, 2321 Hamar",
      lat: 60.7945,
      lng: 11.068,
      imageUrl: "/images/events/hacbc-treff.jpeg",
      isPublished: true,
    },
    {
      title: "4th of July Cruising 2025",
      description:
        "4th of July cruising! Feiring av den amerikanske nasjonaldagen med cruising.",
      date: new Date("2025-07-04T17:00:00"),
      location: "Vandrerhjemmet, Hamar",
      address: "Åkersvikveien 24, 2321 Hamar",
      imageUrl: "/images/events/4th-of-july.jpeg",
      isPublished: true,
    },
    {
      title: "Langenga 2025",
      description: "Treff på Langenga.",
      date: new Date("2025-09-06T12:00:00"),
      location: "Vandrerhjemmet, Hamar",
      address: "Åkersvikveien 24, 2321 Hamar",
      imageUrl: "/images/events/langenga.jpeg",
      isPublished: true,
    },
    {
      title: "Julebord 2025",
      description: "HACBC Julebord - årets sosiale høydepunkt!",
      date: new Date("2025-12-06T18:00:00"),
      location: "Vandrerhjemmet, Hamar",
      address: "Åkersvikveien 24, 2321 Hamar",
      imageUrl: "/images/events/julebord.jpeg",
      isPublished: true,
    },
  ];

  // Update existing 2026 events with images
  const doorslammer2026 = await prisma.event.findFirst({
    where: { title: { contains: "Doorslammer" } },
  });
  if (doorslammer2026) {
    await prisma.event.update({
      where: { id: doorslammer2026.id },
      data: {
        imageUrl: "/images/events/doorslammers.jpeg",
        address: "Industrivegen 19, Kirkenær",
      },
    });
    console.log("Updated Doorslammer 2026 with image");
  }

  const sommertreff2026 = await prisma.event.findFirst({
    where: { title: { contains: "Sommertreff" } },
  });
  if (sommertreff2026) {
    await prisma.event.update({
      where: { id: sommertreff2026.id },
      data: { imageUrl: "/images/events/hacbc-treff.jpeg" },
    });
    console.log("Updated Sommertreff 2026 with image");
  }

  for (const event of newEvents) {
    const exists = existing.find((e) => e.title === event.title);
    if (!exists) {
      await prisma.event.create({ data: event });
      console.log("Created:", event.title);
    } else {
      console.log("Skipped (exists):", event.title);
    }
  }

  console.log("Done!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
