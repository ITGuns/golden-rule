"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { motion, AnimatePresence, useInView, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import {
  ArrowRight,
  FlaskConical,
  Search,
  Activity,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

/** The GoldStandard™ maintenance workflow: TEST → INSPECT → MONITOR → CLEAN → ADJUST. */
const STEPS = [
  {
    key: "TEST",
    icon: FlaskConical,
    blurb:
      "Thermostat accuracy, temperature differential, capacitor values, gas leaks, and carbon monoxide — measured with precise instruments, not guesswork.",
  },
  {
    key: "INSPECT",
    icon: Search,
    blurb:
      "Heat exchangers, duct systems, electrical disconnects, and wiring are inspected for cracks, leaks, energy loss, and safety issues.",
  },
  {
    key: "MONITOR",
    icon: Activity,
    blurb:
      "Refrigerant charge and operating temperatures are verified so the system runs exactly where the manufacturer intended.",
  },
  {
    key: "CLEAN",
    icon: Sparkles,
    blurb:
      "Indoor coils, condensate drains, furnace burners, and blower components are cleaned — including combustible dust removal.",
  },
  {
    key: "ADJUST",
    icon: SlidersHorizontal,
    blurb:
      "Blower components and system airflow are adjusted for safe, efficient operation that protects equipment life.",
  },
];

/** Auto-advance cadence for the timeline. */
const STEP_MS = 3500;

const pad = (n: number) => String(n).padStart(2, "0");

export function MaintenanceTimeline() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { amount: 0.35 });
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [active, setActive] = useState(0);
  // once the user takes over, the auto-advance stays off for good
  const [paused, setPaused] = useState(false);
  const step = STEPS[active];

  useEffect(() => {
    if (reduced || paused || !inView) return;
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(id);
  }, [reduced, paused, inView]);

  const select = (i: number) => {
    setPaused(true);
    setActive(i);
  };

  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (i + 1) % STEPS.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + STEPS.length) % STEPS.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = STEPS.length - 1;
    if (next !== null) {
      e.preventDefault();
      select(next);
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-paper py-24">
      {/* oversized ghosted wordmark behind the rail */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-display text-[9rem] font-bold leading-none text-ink/[0.03]"
      >
        GoldStandard™
      </span>

      <div className="container-site relative">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">GoldStandard™ Planned Maintenance</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">
            Comfort system maintenance — it&apos;s like changing the oil in your car.
          </h2>
          <p className="mt-4 text-muted">
            We test, inspect, monitor, clean, and adjust your system using advanced and precise
            instruments to ensure safe and efficient system operation.
          </p>
        </Reveal>

        <div className="mt-12">
          {/* timeline rail */}
          <div className="relative flex justify-between" role="tablist" aria-label="Maintenance steps">
            <div className="absolute left-0 right-0 top-6 h-0.5 bg-line" aria-hidden />
            <motion.div
              className="absolute left-0 top-6 h-0.5 bg-gold"
              animate={{ width: `${(active / (STEPS.length - 1)) * 100}%` }}
              transition={
                reduced
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 70, damping: 18, mass: 0.6 }
              }
              aria-hidden
            />
            {STEPS.map((s, i) => {
              const isActive = i === active;
              return (
                <button
                  key={s.key}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`maintenance-step-tab-${i}`}
                  aria-selected={isActive}
                  aria-controls="maintenance-step-panel"
                  aria-label={`Step ${i + 1} of ${STEPS.length}: ${s.key}`}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => select(i)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className="group relative z-10 flex flex-col items-center gap-2.5"
                >
                  <motion.span
                    className={cn(
                      "relative grid size-12 place-items-center rounded-2xl border-2 transition-colors duration-300",
                      isActive
                        ? "border-ink bg-gold text-ink shadow-gold"
                        : i < active
                          ? "border-ink bg-gold text-ink"
                          : "border-line bg-white text-muted group-hover:border-gold/60 group-hover:text-ink"
                    )}
                    animate={{ scale: isActive && !reduced ? 1.09 : 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  >
                    <s.icon className="size-5" aria-hidden />
                  </motion.span>
                  <span
                    className={cn(
                      "font-display text-xs font-bold tracking-widest transition-colors duration-300 sm:text-sm",
                      isActive ? "text-ink" : "text-muted"
                    )}
                  >
                    {s.key}
                  </span>
                </button>
              );
            })}
          </div>

          {/* active step detail — gold icon tile + counter + blurb */}
          <div
            id="maintenance-step-panel"
            role="tabpanel"
            aria-labelledby={`maintenance-step-tab-${active}`}
            className="mx-auto mt-10 min-h-[7.5rem] max-w-2xl sm:min-h-[6rem]"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={step.key}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -10 }}
                transition={{ duration: reduced ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-start gap-4 sm:gap-5"
              >
                <span
                  className="grid size-12 shrink-0 place-items-center rounded-2xl border-2 border-ink bg-gold text-ink shadow-gold"
                  aria-hidden
                >
                  <step.icon className="size-5" />
                </span>
                <div className="text-left">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-sm font-bold uppercase tracking-[0.14em] text-ink">
                      {step.key}
                    </span>
                    <span className="font-display text-[12.5px] font-bold tabular-nums tracking-wide text-muted">
                      <span className="text-gold-deep">{pad(active + 1)}</span> / {pad(STEPS.length)}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-body">{step.blurb}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/maintenance" size="lg" className="group !rounded-full">
            Protect Your Comfort
            <ArrowRight
              className="size-4.5 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </ButtonLink>
          <ButtonLink href="/maintenance" variant="outline" size="lg" className="!rounded-full">
            Explore Maintenance
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
