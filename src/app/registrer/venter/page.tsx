import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import Link from "next/link";

export default function WaitingApproval() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <Clock className="mb-4 h-16 w-16 text-hacbc-red" />
          <h1 className="font-[family-name:var(--font-heading)] text-2xl font-bold uppercase">
            Registrering mottatt!
          </h1>
          <p className="mt-4 text-muted-foreground">
            Din konto venter på godkjenning fra en administrator. Du vil få
            tilgang til medlemsområdet når kontoen er godkjent.
          </p>
          <Link
            href="/"
            className="mt-6 text-sm font-medium text-hacbc-red hover:underline"
          >
            Tilbake til forsiden
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
