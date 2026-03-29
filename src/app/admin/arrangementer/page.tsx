import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { DeleteEventButton } from "./DeleteEventButton";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Arrangementer</h2>
        <Link href="/admin/arrangementer/ny">
          <Button className="bg-hacbc-red hover:bg-hacbc-red/80">
            <Plus className="mr-2 h-4 w-4" />
            Nytt arrangement
          </Button>
        </Link>
      </div>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tittel</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Dato</TableHead>
              <TableHead>Sted</TableHead>
              <TableHead>Publisert</TableHead>
              <TableHead className="text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Ingen arrangementer ennå.
                </TableCell>
              </TableRow>
            )}
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">
                  <span className="flex items-center gap-2">
                    {event.title}
                    {event.isClubEvent && (
                      <span className="inline-block rounded bg-hacbc-red/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-hacbc-red">
                        HACBC
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    event.eventType === "AMCAR" ? "bg-blue-900/30 text-blue-400" :
                    event.eventType === "VETERAN" ? "bg-amber-900/30 text-amber-400" :
                    "bg-zinc-800/30 text-zinc-400"
                  }`}>
                    {event.eventType === "AMCAR" ? "Am-car" :
                     event.eventType === "VETERAN" ? "Veteran" :
                     "Generelt"}
                  </span>
                </TableCell>
                <TableCell>
                  {new Date(event.date).toLocaleDateString("nb-NO", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>{event.location ?? "—"}</TableCell>
                <TableCell>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      event.isPublished
                        ? "bg-green-900/30 text-green-400"
                        : "bg-yellow-900/30 text-yellow-400"
                    }`}
                  >
                    {event.isPublished ? "Publisert" : "Kladd"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/arrangementer/${event.id}/rediger`}>
                      <Button variant="outline" size="sm">
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </Link>
                    <DeleteEventButton eventId={event.id} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
