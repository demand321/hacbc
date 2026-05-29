import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApproved, requireSession } from "@/lib/auth-helpers";
import { rateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  isValidId,
  safeStorageName,
} from "@/lib/upload-security";
import { prisma } from "@/lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "uploads";
const MAX_SIZE = 200 * 1024 * 1024; // 200MB hard cap

type UploadKind = "cruising" | "event" | "gallery" | "documents" | "vehicle";

const KIND_TO_ALLOWED_MIMES: Record<UploadKind, Set<string>> = {
  cruising: new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]),
  event: new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]),
  gallery: new Set([...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES]),
  documents: ALLOWED_DOCUMENT_TYPES,
  vehicle: new Set(ALLOWED_IMAGE_TYPES),
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Ugyldig forespørsel" }, { status: 400 });
  }

  const { kind, entityId, contentType, size, signupId } = body as {
    kind?: string;
    entityId?: string;
    contentType?: string;
    size?: number;
    signupId?: string;
  };

  if (
    kind !== "cruising" &&
    kind !== "event" &&
    kind !== "gallery" &&
    kind !== "documents" &&
    kind !== "vehicle"
  ) {
    return NextResponse.json({ error: "Ugyldig kind" }, { status: 400 });
  }
  if (!contentType || typeof contentType !== "string") {
    return NextResponse.json({ error: "Mangler contentType" }, { status: 400 });
  }
  if (!KIND_TO_ALLOWED_MIMES[kind].has(contentType.toLowerCase())) {
    return NextResponse.json({ error: "Filtypen er ikke tillatt" }, { status: 400 });
  }
  if (typeof size === "number" && size > MAX_SIZE) {
    return NextResponse.json({ error: "Filen er for stor" }, { status: 400 });
  }

  // Cruising allows a guest with a valid signupId; all other kinds require an APPROVED session.
  const session = kind === "cruising"
    ? await requireSession()
    : await requireApproved();
  const isAdmin = session?.user?.role === "ADMIN";
  const isApprovedMember = session?.user?.memberStatus === "APPROVED";

  if (kind !== "cruising" && !session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  // Rate limit: per user when logged in, per signupId for guests, IP as fallback.
  const rlKey =
    session?.user?.id ??
    (signupId ? `signup:${signupId}` : `ip:${getClientIp(req)}`);
  const rl = rateLimit(`signed-url:${rlKey}`, 30, 10 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl);

  let prefix: string;

  if (kind === "vehicle") {
    prefix = `vehicles/${session!.user.id}`;
  } else if (kind === "documents") {
    if (!isAdmin) {
      return NextResponse.json({ error: "Ingen tilgang" }, { status: 403 });
    }
    prefix = "documents";
  } else if (kind === "cruising") {
    if (!entityId || !isValidId(entityId)) {
      return NextResponse.json({ error: "Ugyldig entityId" }, { status: 400 });
    }
    const event = await prisma.cruisingEvent.findUnique({
      where: { id: entityId },
      select: { id: true },
    });
    if (!event) return NextResponse.json({ error: "Ukjent cruising-tur" }, { status: 404 });

    if (isAdmin) {
      // admins can always upload
    } else if (isApprovedMember) {
      const signup = await prisma.cruisingSignup.findUnique({
        where: { eventId_userId: { eventId: entityId, userId: session!.user.id } },
      });
      if (!signup) return NextResponse.json({ error: "Ikke påmeldt" }, { status: 403 });
    } else if (signupId && isValidId(signupId)) {
      const guestSignup = await prisma.cruisingSignup.findFirst({
        where: { id: signupId, eventId: entityId },
        select: { id: true },
      });
      if (!guestSignup) return NextResponse.json({ error: "Ikke påmeldt" }, { status: 403 });
    } else {
      return NextResponse.json({ error: "Ikke påmeldt" }, { status: 403 });
    }

    prefix = `cruising/${entityId}`;
  } else if (kind === "event") {
    if (!entityId || !isValidId(entityId)) {
      return NextResponse.json({ error: "Ugyldig entityId" }, { status: 400 });
    }
    const event = await prisma.event.findUnique({
      where: { id: entityId },
      select: { id: true },
    });
    if (!event) return NextResponse.json({ error: "Ukjent arrangement" }, { status: 404 });
    if (!isAdmin) {
      const signup = await prisma.eventSignup.findUnique({
        where: { eventId_userId: { eventId: entityId, userId: session!.user.id } },
      });
      if (!signup) return NextResponse.json({ error: "Ikke påmeldt" }, { status: 403 });
    }
    prefix = `gallery/event-${entityId}`;
  } else {
    // gallery: entityId is albumId
    if (!entityId || !isValidId(entityId)) {
      return NextResponse.json({ error: "Ugyldig entityId" }, { status: 400 });
    }
    const album = await prisma.album.findUnique({
      where: { id: entityId },
      select: { id: true, eventId: true },
    });
    if (!album) return NextResponse.json({ error: "Ukjent album" }, { status: 404 });
    if (!isAdmin) {
      let allowed = false;
      if (album.eventId) {
        const signup = await prisma.eventSignup.findUnique({
          where: { eventId_userId: { eventId: album.eventId, userId: session!.user.id } },
        });
        allowed = !!signup;
      }
      if (!allowed) {
        return NextResponse.json({ error: "Ingen tilgang til album" }, { status: 403 });
      }
    }
    prefix = `gallery/${entityId}`;
  }

  const storagePath = `${prefix}/${safeStorageName(contentType)}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    console.error("Signed URL error:", error);
    return NextResponse.json(
      { error: "Kunne ikke opprette opplastings-URL" },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    publicUrl: urlData.publicUrl,
  });
}
