import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@hacbc.no" },
    update: {},
    create: {
      email: "admin@hacbc.no",
      name: "HACBC Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      memberStatus: "APPROVED",
      memberSince: new Date(),
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  // Create sample events
  const events = [
    {
      title: "Doorslammer's Springmeet 2026",
      description:
        "Årets første store treff! Doorslammer's Springmeet på Rudskogen Motorsenter.",
      date: new Date("2026-05-02T10:00:00"),
      location: "Rudskogen Motorsenter",
      address: "Rudskogen, Rakkestad",
      isPublished: true,
    },
    {
      title: "HACBC Sommertreff 2026",
      description:
        "Klubbens eget sommertreff. Utstilling, grilling og sosialt samvær.",
      date: new Date("2026-06-27T11:00:00"),
      location: "Vandrerhjemmet, Hamar",
      address: "Vandrerhjemmet, Hamar",
      lat: 60.7945,
      lng: 11.068,
      isPublished: true,
    },
    {
      title: "Alvdal Weekend 2026",
      description:
        "Helgetur til Alvdal. Kjøretur gjennom Østerdalen og sosialt program.",
      date: new Date("2026-08-06T09:00:00"),
      endDate: new Date("2026-08-09T15:00:00"),
      location: "Alvdal",
      isPublished: true,
    },
  ];

  for (const event of events) {
    await prisma.event.create({ data: event });
  }
  console.log(`${events.length} events created`);

  // Create sample products
  const products = [
    {
      name: "HACBC Lue",
      description: "Varm lue med HACBC-logo. One size fits all.",
      price: 27500, // 275 NOK in øre
      imageUrls: ["/images/shop/hacbc-lue.jpeg"],
      inStock: true,
      sortOrder: 1,
    },
    {
      name: "HACBC Caps",
      description: "Klassisk caps med HACBC-logo.",
      price: 25000, // 250 NOK in øre
      imageUrls: ["/images/shop/hacbc-caps.jpeg"],
      inStock: true,
      sortOrder: 2,
    },
  ];

  for (const product of products) {
    await prisma.product.create({ data: product });
  }
  console.log(`${products.length} products created`);

  // Create sample cruising route
  const route = await prisma.cruisingRoute.create({
    data: {
      title: "Hamar - Mjøsa rundt",
      description:
        "Standard rute. Vi starter fra Vandrerhjemmet og kjører en tur rundt Mjøsa.",
      isActive: true,
      waypoints: {
        create: [
          {
            name: "Start: Vandrerhjemmet",
            lat: 60.7945,
            lng: 11.068,
            sortOrder: 0,
            note: "Oppmøte kl 18:00",
          },
          {
            name: "Brumunddal",
            lat: 60.8813,
            lng: 10.9435,
            sortOrder: 1,
          },
          {
            name: "Moelv",
            lat: 60.9333,
            lng: 10.7,
            sortOrder: 2,
          },
          {
            name: "Gjøvik (snupunkt)",
            lat: 60.7957,
            lng: 10.6916,
            sortOrder: 3,
            note: "Kort stopp",
          },
          {
            name: "Tilbake: Vandrerhjemmet",
            lat: 60.7945,
            lng: 11.068,
            sortOrder: 4,
          },
        ],
      },
    },
  });
  console.log(`Cruising route created: ${route.title}`);

  // Create site content
  await prisma.siteContent.create({
    data: {
      key: "forside_hero",
      title: "Velkommen til HACBC",
      body: "For entusiaster av amerikanske biler og motorsykler i Hamar-regionen.",
    },
  });

  await prisma.siteContent.create({
    data: {
      key: "om_klubben",
      title: "Om klubben",
      body: "HACBC ble stiftet av bilentusiaster i Hamar som deler lidenskapen for amerikanske biler og motorsykler. Vi holder til på Vandrerhjemmet ved Vikingskipet i Hamar.",
    },
  });
  console.log("Site content created");

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
