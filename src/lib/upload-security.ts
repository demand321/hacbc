export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

const EXT_FROM_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "text/plain": "txt",
};

export function extFromMime(mime: string): string {
  return EXT_FROM_MIME[mime.toLowerCase()] || "bin";
}

export type AllowedKind = "image" | "video" | "imageOrVideo" | "document";

export function isMimeAllowed(mime: string, kind: AllowedKind): boolean {
  const m = mime.toLowerCase();
  switch (kind) {
    case "image":
      return ALLOWED_IMAGE_TYPES.has(m);
    case "video":
      return ALLOWED_VIDEO_TYPES.has(m);
    case "imageOrVideo":
      return ALLOWED_IMAGE_TYPES.has(m) || ALLOWED_VIDEO_TYPES.has(m);
    case "document":
      return ALLOWED_DOCUMENT_TYPES.has(m);
  }
}

const VALID_FOLDER = /^[a-zA-Z0-9_/-]+$/;

export function validateFolder(folder: string, allowedPrefixes: string[]): boolean {
  if (!folder || folder.includes("..") || !VALID_FOLDER.test(folder)) return false;
  return allowedPrefixes.some((p) => folder === p || folder.startsWith(`${p}/`));
}

const VALID_ID = /^[a-zA-Z0-9_-]{1,64}$/;

export function isValidId(id: string): boolean {
  return VALID_ID.test(id);
}

export function safeStorageName(mime: string): string {
  const ext = extFromMime(mime);
  return `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
}

export function isStoragePathUnder(storagePath: string, prefix: string): boolean {
  if (!storagePath || typeof storagePath !== "string") return false;
  if (storagePath.includes("..")) return false;
  return storagePath.startsWith(`${prefix}/`);
}
