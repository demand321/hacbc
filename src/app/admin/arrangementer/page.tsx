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
              <TableHead>Dato</TableHead>
              <TableHead>Sted</TableHead>
              <TableHead>Publisert</TableHead>
              <TableHead className="text-right">Handlinger</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Ingen arrangementer ennå.
                </TableCell>
              </TableRow>
            )}
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
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
