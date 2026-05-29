const LARGE_FILE_THRESHOLD = 4 * 1024 * 1024;

export async function uploadVehicleImage(file: File): Promise<string> {
  if (file.size <= LARGE_FILE_THRESHOLD) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Opplasting feilet");
    }
    const data = await res.json();
    return data.url as string;
  }

  const signedRes = await fetch("/api/upload/signed-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "vehicle",
      contentType: file.type,
      size: file.size,
    }),
  });
  if (!signedRes.ok) {
    const data = await signedRes.json().catch(() => ({}));
    throw new Error(data.error || "Kunne ikke starte opplasting");
  }
  const { signedUrl, publicUrl } = await signedRes.json();

  const putRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error("Opplasting til lagring feilet");
  }
  return publicUrl as string;
}
