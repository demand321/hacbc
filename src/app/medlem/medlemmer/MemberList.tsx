"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Car, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Member = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  avatarUrl: string | null;
  memberSince: string | null;
  vehicleCount: number;
  vehicles: { make: string; model: string; year: number | null }[];
};

export function MemberList({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Navn</TableHead>
          <TableHead className="hidden sm:table-cell">Telefon</TableHead>
          <TableHead className="hidden md:table-cell">Adresse</TableHead>
          <TableHead className="hidden lg:table-cell">Medlem siden</TableHead>
          <TableHead className="text-right">Kontakt</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isExpanded = expandedId === member.id;
          const location = [member.postalCode, member.city].filter(Boolean).join(" ");

          return (
            <React.Fragment key={member.id}>
              <TableRow
                className="cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : member.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {member.avatarUrl ? (
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        member.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground sm:hidden">
                        {member.phone || member.city || ""}
                      </p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="ml-auto h-4 w-4 text-muted-foreground lg:hidden" />
                    ) : (
                      <ChevronDown className="ml-auto h-4 w-4 text-muted-foreground lg:hidden" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {member.phone ? (
                    <a href={`tel:${member.phone}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                      {member.phone}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {member.address || location ? (
                    <div className="text-sm">
                      {member.address && <p>{member.address}</p>}
                      {location && <p>{location}</p>}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {member.memberSince
                    ? new Date(member.memberSince).toLocaleDateString("nb-NO", {
                        month: "short",
                        year: "numeric",
                      })
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {member.id !== currentUserId && (
                    <Button asChild size="sm" variant="ghost" className="h-8 px-2" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Link href={`/medlem/meldinger/${member.id}`}>
                        <Mail className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </TableCell>
              </TableRow>

              {isExpanded && (
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={5} className="p-4">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${member.email}`} className="hover:underline">
                          {member.email}
                        </a>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <a href={`tel:${member.phone}`} className="hover:underline">
                            {member.phone}
                          </a>
                        </div>
                      )}
                      {(member.address || location) && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {[member.address, location].filter(Boolean).join(", ")}
                          </span>
                        </div>
                      )}
                      {member.vehicles.length > 0 && (
                        <div className="flex items-start gap-2 text-sm">
                          <Car className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div>
                            {member.vehicles.map((v, i) => (
                              <p key={i}>
                                {[v.year, v.make, v.model].filter(Boolean).join(" ")}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {member.id !== currentUserId && (
                      <div className="mt-3">
                        <Button asChild size="sm">
                          <Link href={`/medlem/meldinger/${member.id}`}>
                            <Mail className="mr-2 h-4 w-4" />
                            Send melding
                          </Link>
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          );
        })}
      </TableBody>
    </Table>
  );
}
