"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm("Er du sikker på at du vil slette dette arrangementet?")) return;
    setLoading(true);
    await fetch("/api/admin/arrangementer", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: eventId }),
    });
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={handleDelete}
      className="text-red-400 hover:text-red-300"
    >
      <Trash2 className="h-3 w-3" />
    </Button>
  );
}
