import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-line bg-white shadow-[0_1px_3px_rgb(0_0_0/0.06)] dark:border-night-line dark:bg-night-soft",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "gold" | "green" | "red" | "blue" | "purple" | "orange";
}) {
  const tones = {
    neutral: "bg-black/5 text-body dark:bg-white/10 dark:text-gray-200",
    gold: "bg-gold-soft text-[#8a6d00] dark:bg-gold/15 dark:text-gold",
    green: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
    red: "bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
    purple: "bg-purple-100 text-purple-800 dark:bg-purple-500/15 dark:text-purple-300",
    orange: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
