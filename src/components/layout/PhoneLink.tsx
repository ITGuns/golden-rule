"use client";

import { COMPANY } from "@/lib/site";
import { track } from "@/lib/analytics-client";
import { cn } from "@/lib/utils";
import { Phone } from "lucide-react";
import type { ReactNode } from "react";

export function PhoneLink({
  className,
  children,
  showIcon = true,
  label,
}: {
  className?: string;
  children?: ReactNode;
  showIcon?: boolean;
  label?: string;
}) {
  return (
    <a
      href={COMPANY.phoneHref}
      className={cn("inline-flex items-center gap-2", className)}
      onClick={() => track("phone_click", { label })}
    >
      {showIcon && <Phone className="size-4" aria-hidden />}
      {children ?? COMPANY.phone}
    </a>
  );
}
