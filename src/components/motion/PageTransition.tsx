"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { track } from "@/lib/analytics-client";

/**
 * Route transition wrapper (used from the public template.tsx so it remounts
 * per navigation). Fast — 0.45s max — and skipped for reduced motion.
 * Also fires the page_view analytics event per route.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const pathname = usePathname();

  useEffect(() => {
    track("page_view");
  }, [pathname]);

  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
