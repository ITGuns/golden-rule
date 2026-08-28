"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export function Counter({
  to,
  prefix = "",
  suffix = "",
  className,
}: {
  to: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const value = useMotionValue(0);
  const spring = useSpring(value, { duration: 1.6, bounce: 0 });

  useEffect(() => {
    if (inView) value.set(to);
  }, [inView, to, value]);

  useEffect(() => {
    if (reduced) {
      if (ref.current) ref.current.textContent = `${prefix}${to.toLocaleString()}${suffix}`;
      return;
    }
    const unsub = spring.on("change", (v) => {
      if (ref.current)
        ref.current.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`;
    });
    return unsub;
  }, [spring, prefix, suffix, reduced, to]);

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
