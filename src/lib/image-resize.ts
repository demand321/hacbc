// Client-side downscale/recompress before upload. Runs in the browser so it
// also doubles as a HEIC->JPEG converter: canvas can only ever export JPEG/PNG/WebP,
// and Safari (incl. all iOS browsers, which are WebKit under the hood) can decode
// HEIC into an ImageBitmap even though Chrome/Firefox/Android cannot — so iPhone
// photos come out as normal JPEGs automatically, while non-Safari browsers that
// fail to decode HEIC just fall back to uploading the original file untouched.
const MAX_DIMENSION = 2200;
const JPEG_QUALITY = 0.85;
const SKIP_THRESHOLD = 2 * 1024 * 1024; // don't bother re-encoding small files

export async function resizeImageFile(file: File): Promise<File> {
  // Preserve animation — a resize would flatten a GIF to a single frame.
  if (file.type === "image/gif") return file;

  const isHeic = file.type === "image/heic" || file.type === "image/heif";

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Browser can't decode this format (e.g. HEIC in Chrome/Firefox) —
    // upload the original rather than fail the whole flow.
    return file;
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const needsResize = scale < 1;

  if (!isHeic && !needsResize && file.size <= SKIP_THRESHOLD) {
    bitmap.close();
    return file;
  }

  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY)
  );
  if (!blob) return file;

  // Never make things worse: if we didn't need to resize or convert the
  // format, and the recompressed version is bigger, keep the original.
  if (!isHeic && !needsResize && blob.size >= file.size) return file;

  const newName = file.name.replace(/\.[^./\\]+$/, "") + ".jpg";
  return new File([blob], newName, {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}
