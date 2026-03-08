"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { nb } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value: string; // ISO date string (yyyy-MM-dd) or empty
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Velg dato",
  id,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Parse the ISO string to a Date
  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const isValidDate = selectedDate && isValid(selectedDate);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <Button
        id={id}
        type="button"
        variant="outline"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full justify-start text-left font-normal",
          !isValidDate && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {isValidDate
          ? format(selectedDate, "dd.MM.yyyy", { locale: nb })
          : placeholder}
      </Button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-2 shadow-lg">
          <Calendar
            mode="single"
            selected={isValidDate ? selectedDate : undefined}
            onSelect={(date) => {
              if (date) {
                onChange(format(date, "yyyy-MM-dd"));
              } else {
                onChange("");
              }
              setOpen(false);
            }}
            locale={nb}
            weekStartsOn={1}
          />
        </div>
      )}
    </div>
  );
}
