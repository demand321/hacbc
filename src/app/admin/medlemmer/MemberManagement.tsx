"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Shield } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  memberStatus: string;
  memberSince: Date | null;
  createdAt: Date;
};

export function MemberManagement({ users }: { users: User[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(
    userId: string,
    action: "approve" | "reject" | "make-admin" | "remove-admin"
  ) {
    setLoading(userId);
    await fetch("/api/admin/medlemmer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    setLoading(null);
    router.refresh();
  }

  const pending = users.filter((u) => u.memberStatus === "PENDING");
  const approved = users.filter((u) => u.memberStatus === "APPROVED");

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-medium text-hacbc-red">
            Venter på godkjenning ({pending.length})
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Navn</TableHead>
                <TableHead>E-post</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Registrert</TableHead>
                <TableHead className="text-right">Handlinger</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone || "-"}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString("nb-NO")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(user.id, "approve")}
                        disabled={loading === user.id}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Godkjenn
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAction(user.id, "reject")}
                        disabled={loading === user.id}
                      >
                        <X className="mr-1 h-4 w-4" />
                        Avslå
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div>
        <h3 className="mb-4 text-lg font-medium">
          Medlemmer ({approved.length})
        </h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Navn</TableHead>
              <TableHead>E-post</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Medlem siden</TableHead>
              <TableHead className="text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approved.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                  >
                    {user.role === "ADMIN" ? "Admin" : "Medlem"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {user.memberSince
                    ? new Date(user.memberSince).toLocaleDateString("nb-NO")
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {user.role !== "ADMIN" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAction(user.id, "make-admin")}
                      disabled={loading === user.id}
                    >
                      <Shield className="mr-1 h-4 w-4" />
                      Gjør admin
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAction(user.id, "remove-admin")}
                      disabled={loading === user.id}
                    >
                      Fjern admin
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
