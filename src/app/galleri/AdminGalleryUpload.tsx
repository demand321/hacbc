"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminGalleryUpload({ albumId }: { albumId: string }) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function handleUpload(files: FileList) {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("albumId", albumId);
      await fetch("/api/admin/galleri/photos", { method: "POST", body: formData });
    }
    setUploading(false);
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={uploading}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*,video/*";
        input.multiple = true;
        input.onchange = () => {
          if (input.files?.length) handleUpload(input.files);
        };
        input.click();
      }}
      className="absolute bottom-2 left-2 z-10 bg-black/70 text-white hover:bg-black/90"
    >
      <Upload className="mr-1.5 h-3 w-3" />
      {uploading ? "Laster opp..." : "Last opp"}
    </Button>
  );
}
