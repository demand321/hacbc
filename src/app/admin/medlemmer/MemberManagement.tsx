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
import { Check, X, Shield, UserPlus, KeyRound, Pencil } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  role: string;
  memberStatus: string;
  mustChangePassword: boolean;
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
  const [addAddress, setAddAddress] = useState("");
  const [addPostalCode, setAddPostalCode] = useState("");
  const [addCity, setAddCity] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addError, setAddError] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editError, setEditError] = useState("");

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
        address: addAddress || null,
        postalCode: addPostalCode || null,
        city: addCity || null,
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
    setAddAddress("");
    setAddPostalCode("");
    setAddCity("");
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

  async function handleResetPassword(userId: string) {
    if (!resetPassword || resetPassword.length < 4) return;
    setLoading(userId);
    await fetch("/api/admin/medlemmer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "reset-password", password: resetPassword }),
    });
    setResetUserId(null);
    setResetPassword("");
    setLoading(null);
    router.refresh();
  }

  async function handleEditUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setEditError("");
    setLoading(editUser.id);

    const res = await fetch("/api/admin/medlemmer", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: editUser.id,
        action: "update-user",
        name: editUser.name,
        email: editUser.email,
        phone: editUser.phone || null,
        address: editUser.address || null,
        postalCode: editUser.postalCode || null,
        city: editUser.city || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setEditError(data.error || "Noe gikk galt");
      setLoading(null);
      return;
    }

    setEditUser(null);
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
              <Label htmlFor="addAddress">Adresse</Label>
              <Input id="addAddress" value={addAddress} onChange={(e) => setAddAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="addPostalCode">Postnr</Label>
                <Input id="addPostalCode" value={addPostalCode} onChange={(e) => setAddPostalCode(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="addCity">Poststed</Label>
                <Input id="addCity" value={addCity} onChange={(e) => setAddCity(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="addPassword">Midlertidig passord *</Label>
              <Input
                id="addPassword"
                type="text"
                minLength={4}
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                required
                placeholder="F.eks. hacbc2025"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Medlemmet må bytte passord ved første innlogging.
              </p>
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
              editUser?.id === user.id ? (
                <TableRow key={user.id}>
                  <TableCell colSpan={5}>
                    <form onSubmit={handleEditUser} className="space-y-3 py-2">
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <Label>Navn</Label>
                          <Input
                            value={editUser.name}
                            onChange={(e) => setEditUser({ ...editUser, name: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>E-post</Label>
                          <Input
                            type="email"
                            value={editUser.email}
                            onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label>Telefon</Label>
                          <Input
                            value={editUser.phone || ""}
                            onChange={(e) => setEditUser({ ...editUser, phone: e.target.value || null })}
                          />
                        </div>
                        <div>
                          <Label>Adresse</Label>
                          <Input
                            value={editUser.address || ""}
                            onChange={(e) => setEditUser({ ...editUser, address: e.target.value || null })}
                          />
                        </div>
                        <div>
                          <Label>Postnr</Label>
                          <Input
                            value={editUser.postalCode || ""}
                            onChange={(e) => setEditUser({ ...editUser, postalCode: e.target.value || null })}
                          />
                        </div>
                        <div>
                          <Label>Poststed</Label>
                          <Input
                            value={editUser.city || ""}
                            onChange={(e) => setEditUser({ ...editUser, city: e.target.value || null })}
                          />
                        </div>
                      </div>
                      {editError && <p className="text-sm text-destructive">{editError}</p>}
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={loading === user.id}>
                          {loading === user.id ? "Lagrer..." : "Lagre"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => { setEditUser(null); setEditError(""); }}>
                          Avbryt
                        </Button>
                      </div>
                    </form>
                  </TableCell>
                </TableRow>
              ) : (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.name}
                  {user.mustChangePassword && (
                    <span className="ml-2 text-xs text-amber-400">
                      (har ikke byttet passord)
                    </span>
                  )}
                </TableCell>
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
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditUser({ ...user })}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      Rediger
                    </Button>
                    {resetUserId === user.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          placeholder="Nytt passord"
                          className="h-8 w-32 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleResetPassword(user.id);
                            if (e.key === "Escape") { setResetUserId(null); setResetPassword(""); }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleResetPassword(user.id)}
                          disabled={loading === user.id || resetPassword.length < 4}
                        >
                          OK
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setResetUserId(null); setResetPassword(""); }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setResetUserId(user.id)}
                      >
                        <KeyRound className="mr-1 h-3 w-3" />
                        Reset passord
                      </Button>
                    )}
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
                  </div>
                </TableCell>
              </TableRow>
              )
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
