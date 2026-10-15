// One-off ops script: scans storage for oversized / HEIC images referenced by
// the DB, downscales the former with sharp, and leaves the latter as a report
// (sharp's prebuilt binary cannot decode HEIC — see console output).
// Usage: see printed banner, or the message from whoever asked you to run this.
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import sharp from "sharp";
import * as readline from "node:readline/promises";

const DIRECT_URL = process.env.DIRECT_URL || process.env.DATABASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!DIRECT_URL || !SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env vars. Need DIRECT_URL (or DATABASE_URL), NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY."
  );
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

const adapter = new PrismaPg({ connectionString: DIRECT_URL });
const prisma = new PrismaClient({ adapter });
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const BUCKET = "uploads";

const MAX_DIMENSION = 2200;
const JPEG_QUALITY = 85;
const LARGE_BYTES = 1.5 * 1024 * 1024;
const HEIC_EXT = /\.(heic|heif)$/i;

type Obj = { path: string; size: number; mimetype: string | null };
type Ref = { table: string; row: string; field: "single" | "array"; id: string; urlOrPath: string };

async function listRecursive(prefix: string): Promise<Obj[]> {
  const out: Obj[] = [];
  async function walk(p: string) {
    const { data, error } = await supabase.storage.from(BUCKET).list(p, { limit: 1000 });
    if (error || !data) return;
    for (const entry of data) {
      const full = p ? `${p}/${entry.name}` : entry.name;
      if (entry.id === null) {
        await walk(full);
      } else {
        out.push({ path: full, size: entry.metadata?.size ?? 0, mimetype: entry.metadata?.mimetype ?? null });
      }
    }
  }
  await walk(prefix);
  return out;
}

function pathFromUrl(url: string): string {
  const marker = "/object/public/uploads/";
  const idx = url.indexOf(marker);
  return idx >= 0 ? decodeURIComponent(url.slice(idx + marker.length)) : url;
}

async function buildReferences() {
  const [vehicles, photos, cruisingPhotos, products, events, siteContent] = await Promise.all([
    prisma.vehicle.findMany({ select: { id: true, make: true, model: true, imageUrls: true } }),
    prisma.photo.findMany({ select: { id: true, url: true, storagePath: true, albumId: true } }),
    prisma.cruisingPhoto.findMany({ select: { id: true, url: true, storagePath: true, eventId: true } }),
    prisma.product.findMany({ select: { id: true, name: true, imageUrls: true } }),
    prisma.event.findMany({ select: { id: true, title: true, imageUrl: true } }),
    prisma.siteContent.findMany({ select: { id: true, imageUrl: true } }),
  ]);

  const refs: Ref[] = [];
  for (const v of vehicles)
    v.imageUrls.forEach((u) =>
      refs.push({ table: "Vehicle", row: `${v.make} ${v.model}`, field: "array", id: v.id, urlOrPath: u })
    );
  for (const p of photos)
    refs.push({ table: "Photo", row: `album ${p.albumId}`, field: "single", id: p.id, urlOrPath: p.storagePath });
  for (const cp of cruisingPhotos)
    refs.push({
      table: "CruisingPhoto",
      row: `event ${cp.eventId}`,
      field: "single",
      id: cp.id,
      urlOrPath: cp.storagePath,
    });
  for (const pr of products)
    pr.imageUrls.forEach((u) =>
      refs.push({ table: "Product", row: pr.name, field: "array", id: pr.id, urlOrPath: u })
    );
  for (const ev of events)
    if (ev.imageUrl) refs.push({ table: "Event", row: ev.title, field: "single", id: ev.id, urlOrPath: ev.imageUrl });
  for (const sc of siteContent)
    if (sc.imageUrl) refs.push({ table: "SiteContent", row: sc.id, field: "single", id: sc.id, urlOrPath: sc.imageUrl });

  return refs;
}

async function updateReference(ref: Ref, oldPath: string, newUrl: string, newStoragePath: string) {
  switch (ref.table) {
    case "Vehicle": {
      const v = await prisma.vehicle.findUniqueOrThrow({ where: { id: ref.id }, select: { imageUrls: true } });
      const updated = v.imageUrls.map((u) => (pathFromUrl(u) === oldPath ? newUrl : u));
      await prisma.vehicle.update({ where: { id: ref.id }, data: { imageUrls: updated } });
      break;
    }
    case "Photo":
      await prisma.photo.update({ where: { id: ref.id }, data: { url: newUrl, storagePath: newStoragePath } });
      break;
    case "CruisingPhoto":
      await prisma.cruisingPhoto.update({ where: { id: ref.id }, data: { url: newUrl, storagePath: newStoragePath } });
      break;
    case "Product": {
      const pr = await prisma.product.findUniqueOrThrow({ where: { id: ref.id }, select: { imageUrls: true } });
      const updated = pr.imageUrls.map((u) => (pathFromUrl(u) === oldPath ? newUrl : u));
      await prisma.product.update({ where: { id: ref.id }, data: { imageUrls: updated } });
      break;
    }
    case "Event":
      await prisma.event.update({ where: { id: ref.id }, data: { imageUrl: newUrl } });
      break;
    case "SiteContent":
      await prisma.siteContent.update({ where: { id: ref.id }, data: { imageUrl: newUrl } });
      break;
  }
}

async function main() {
  console.log("=".repeat(70));
  console.log(`Target Supabase: ${SUPABASE_URL}`);
  console.log(`Target DB host:  ${new URL(DIRECT_URL!.replace("postgres://", "http://").replace("postgresql://", "http://")).host}`);
  console.log(`Mode: ${APPLY ? "APPLY (will write)" : "DRY RUN (read-only)"}`);
  console.log("=".repeat(70));

  const prefixes = ["avatars", "vehicles", "gallery", "cruising"];
  let all: Obj[] = [];
  for (const p of prefixes) {
    const objs = await listRecursive(p);
    all = all.concat(objs);
  }
  console.log(`Scanned ${all.length} storage objects.\n`);

  const heicFiles = all.filter(
    (o) => HEIC_EXT.test(o.path) || o.mimetype === "image/heic" || o.mimetype === "image/heif"
  );
  const largeImages = all.filter(
    (o) =>
      o.size > LARGE_BYTES &&
      !heicFiles.includes(o) &&
      (o.mimetype?.startsWith("image/") ?? /\.(jpe?g|png|webp)$/i.test(o.path))
  );

  const flaggedPaths = new Set([...heicFiles, ...largeImages].map((f) => f.path));
  const refs = await buildReferences();
  const refsByPath = new Map<string, Ref[]>();
  for (const r of refs) {
    const p = pathFromUrl(r.urlOrPath);
    if (!flaggedPaths.has(p)) continue;
    if (!refsByPath.has(p)) refsByPath.set(p, []);
    refsByPath.get(p)!.push(r);
  }

  const heicReferenced = heicFiles.filter((f) => refsByPath.has(f.path));
  const largeReferenced = largeImages.filter((f) => refsByPath.has(f.path));

  console.log(`HEIC/HEIF files referenced in DB: ${heicReferenced.length}`);
  console.log("These CANNOT be auto-converted (sharp can't decode HEIC). Ask these to re-upload:");
  for (const f of heicReferenced) {
    for (const r of refsByPath.get(f.path)!) {
      console.log(`  [${r.table}] ${r.row} (id ${r.id}) -> ${f.path} (${(f.size / 1024).toFixed(0)}KB)`);
    }
  }

  console.log(`\nLarge non-HEIC images referenced in DB: ${largeReferenced.length}`);
  const totalBytes = largeReferenced.reduce((s, f) => s + f.size, 0);
  console.log(`Total size: ${(totalBytes / 1024 / 1024).toFixed(1)}MB`);
  for (const f of largeReferenced) {
    for (const r of refsByPath.get(f.path)!) {
      console.log(`  [${r.table}] ${r.row} (id ${r.id}) -> ${f.path} (${(f.size / 1024 / 1024).toFixed(2)}MB)`);
    }
  }

  if (!APPLY) {
    console.log("\nDry run only — nothing changed. Re-run with --apply to resize the list above.");
    return;
  }

  if (largeReferenced.length === 0) {
    console.log("\nNothing to resize.");
    return;
  }

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(
    `\nAbout to resize+reupload ${largeReferenced.length} files and update their DB rows on the target above. Type JA to continue: `
  );
  rl.close();
  if (answer.trim() !== "JA") {
    console.log("Aborted.");
    return;
  }

  let done = 0;
  for (const f of largeReferenced) {
    const refsForFile = refsByPath.get(f.path)!;
    try {
      const { data: fileData, error: dlError } = await supabase.storage.from(BUCKET).download(f.path);
      if (dlError || !fileData) {
        console.error(`  SKIP ${f.path}: download failed (${dlError?.message})`);
        continue;
      }
      const inputBuffer = Buffer.from(await fileData.arrayBuffer());

      const resized = await sharp(inputBuffer)
        .rotate() // auto-orient from EXIF, then strip it
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY })
        .toBuffer();

      if (resized.length >= inputBuffer.length) {
        console.log(`  SKIP ${f.path}: recompressed version wasn't smaller, leaving as-is.`);
        continue;
      }

      const folder = f.path.substring(0, f.path.lastIndexOf("/"));
      const newPath = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;

      const { error: upError } = await supabase.storage
        .from(BUCKET)
        .upload(newPath, resized, { contentType: "image/jpeg", upsert: false });
      if (upError) {
        console.error(`  SKIP ${f.path}: upload failed (${upError.message})`);
        continue;
      }
      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(newPath);

      for (const r of refsForFile) {
        await updateReference(r, f.path, urlData.publicUrl, newPath);
      }

      done++;
      console.log(
        `  OK ${f.path} (${(inputBuffer.length / 1024 / 1024).toFixed(2)}MB) -> ${newPath} (${(resized.length / 1024).toFixed(0)}KB), updated ${refsForFile.length} row(s)`
      );
    } catch (err) {
      console.error(`  SKIP ${f.path}:`, err instanceof Error ? err.message : err);
    }
  }

  console.log(`\nDone. Resized and updated ${done}/${largeReferenced.length} files.`);
  console.log("Old originals were left in storage untouched (not deleted) — safe to clean up separately later.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
