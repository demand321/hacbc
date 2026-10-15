"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BackButton({
  fallbackHref,
  children = "Tilbake",
  className,
  variant,
  ...props
}: {
  fallbackHref: string;
  children?: React.ReactNode;
} & Omit<ButtonProps, "onClick" | "children">) {
  const router = useRouter();

  return (
    <Button
      variant={variant}
      className={cn(className)}
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      {...props}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {children}
    </Button>
  );
}
