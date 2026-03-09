import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = "uploads";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ikke autorisert" }, { status: 401 });
  }

  const { fileName, contentType, folder } = await req.json();

  if (!fileName || !contentType) {
    return NextResponse.json({ error: "Mangler filnavn eller type" }, { status: 400 });
  }

  const ext = fileName.split(".").pop() || "bin";
  const storagePath = `${folder || "uploads"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json({ error: "Kunne ikke opprette opplastings-URL" }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    storagePath,
    publicUrl: urlData.publicUrl,
  });
}
