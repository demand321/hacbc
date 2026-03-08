"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteVehicleButton({ vehicleId }: { vehicleId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Er du sikker på at du vil slette dette kjøretøyet?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/medlem/kjoretoy?id=${vehicleId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleDelete}
      disabled={deleting}
      className="text-red-500 hover:text-red-400"
    >
      <Trash2 className="mr-1 h-3 w-3" />
      {deleting ? "Sletter..." : "Slett"}
    </Button>
  );
}
