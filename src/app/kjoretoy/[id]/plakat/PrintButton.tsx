"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <Button size="lg" onClick={() => window.print()}>
      <Printer className="mr-2 h-5 w-5" />
      Skriv ut plakat
    </Button>
  );
}
