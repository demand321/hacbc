"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X, Shield, UserPlus } from "lucide-react";

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");
    setAddSaving(true);

    const res = await fetch("/api/admin/medlemmer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addName,
        email: addEmail,
        phone: addPhone || null,
        password: addPassword,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setAddError(data.error || "Noe gikk galt");
      setAddSaving(false);
      return;
    }

    setAddName("");
    setAddEmail("");
    setAddPhone("");
    setAddPassword("");
    setShowAddForm(false);
    setAddSaving(false);
    router.refresh();
  }

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
      {/* Add member */}
      <div>
        {!showAddForm ? (
          <Button onClick={() => setShowAddForm(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Legg til medlem
          </Button>
        ) : (
          <form onSubmit={handleAddMember} className="max-w-md space-y-3 rounded-lg border border-border p-4">
            <h3 className="text-sm font-medium">Legg til nytt medlem</h3>
            <div>
              <Label htmlFor="addName">Navn *</Label>
              <Input id="addName" value={addName} onChange={(e) => setAddName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="addEmail">E-post *</Label>
              <Input id="addEmail" type="email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="addPhone">Telefon</Label>
              <Input id="addPhone" value={addPhone} onChange={(e) => setAddPhone(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="addPassword">Passord * (min 8 tegn)</Label>
              <Input id="addPassword" type="password" minLength={8} value={addPassword} onChange={(e) => setAddPassword(e.target.value)} required />
            </div>
            {addError && <p className="text-sm text-destructive">{addError}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={addSaving}>
                {addSaving ? "Lagrer..." : "Opprett medlem"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                Avbryt
              </Button>
            </div>
          </form>
        )}
      </div>

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
