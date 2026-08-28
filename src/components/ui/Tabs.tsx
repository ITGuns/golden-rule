"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState, type ReactNode, useId } from "react";

export function Tabs({
  tabs,
  className,
  initial,
}: {
  tabs: { key: string; label: string; content: ReactNode; count?: number }[];
  className?: string;
  initial?: string;
}) {
  const [active, setActive] = useState(initial || tabs[0]?.key);
  const id = useId();
  const current = tabs.find((t) => t.key === active) || tabs[0];

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-line dark:border-night-line"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            id={`${id}-tab-${t.key}`}
            aria-selected={active === t.key}
            aria-controls={`${id}-panel-${t.key}`}
            onClick={() => setActive(t.key)}
            className={cn(
              "relative shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors",
              active === t.key
                ? "text-ink dark:text-white"
                : "text-muted hover:text-ink dark:hover:text-white"
            )}
          >
            {t.label}
            {typeof t.count === "number" && (
              <span className="ml-1.5 rounded-full bg-black/5 px-1.5 py-0.5 text-xs dark:bg-white/10">
                {t.count}
              </span>
            )}
            {active === t.key && (
              <motion.div
                layoutId={`${id}-underline`}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gold"
              />
            )}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${id}-panel-${current?.key}`}
        aria-labelledby={`${id}-tab-${current?.key}`}
        className="pt-4"
      >
        {current?.content}
      </div>
    </div>
  );
}
