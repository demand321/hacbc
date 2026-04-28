import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireApproved } from "@/lib/auth-helpers";
import { isMimeAllowed, extFromMime } from "@/lib/upload-security";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "uploads";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const session = await requireApproved();
  if (!session) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  // 30 uploads per user per 10 min
  const rl = rateLimit(`upload:${session.user.id}`, 30, 10 * 60 * 1000);
  if (!rl.ok) return rateLimitResponse(rl);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "Ingen fil valgt" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Filen er for stor (maks 10MB)" },
      { status: 400 }
    );
  }

  if (!isMimeAllowed(file.type, "image")) {
    return NextResponse.json(
      { error: "Kun bildefiler er tillatt (jpg, png, webp, gif, heic)" },
      { status: 400 }
    );
  }

  // Derive extension from validated MIME, never from filename
  const ext = extFromMime(file.type);
  const fileName = `avatars/${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Opplasting feilet" },
      { status: 500 }
    );
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  return NextResponse.json({
    url: urlData.publicUrl,
    path: fileName,
  });
}
