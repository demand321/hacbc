"use client";

import { useRouter } from "next/navigation";

const statuses = [
  { value: "ny", label: "Ny" },
  { value: "behandles", label: "Behandles" },
  { value: "sendt", label: "Sendt" },
  { value: "levert", label: "Levert" },
  { value: "kansellert", label: "Kansellert" },
];

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string;
  currentStatus: string;
}) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await fetch("/api/admin/shop/bestillinger", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status: e.target.value }),
    });
    router.refresh();
  }

  return (
    <select
      defaultValue={currentStatus}
      onChange={handleChange}
      className="rounded-md border border-border bg-background px-2 py-1 text-sm"
    >
      {statuses.map((s) => (
        <option key={s.value} value={s.value}>
          {s.label}
        </option>
      ))}
    </select>
  );
}
