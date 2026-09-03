"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  AirVent,
  Fan,
  Filter,
  Flame,
  Home,
  Snowflake,
  Sofa,
  Thermometer,
  Wind,
} from "lucide-react";
import type { ComponentType } from "react";

type AirflowMode = "cooling" | "heating" | "filtration";
type IconType = ComponentType<{ className?: string }>;

const MODES: { key: AirflowMode; label: string; icon: IconType; blurb: string; image: string }[] = [
  {
    key: "cooling",
    label: "Cooling",
    icon: Snowflake,
    blurb:
      "Warm air is pulled through the return, filtered, then passes over the cold evaporator coil where heat and humidity are removed before cool air is supplied back to every room.",
    image: "/images/AC_A_029-How-Your-AC-Cools-Your-Home-2-e1628799548613.jpg",
  },
  {
    key: "heating",
    label: "Heating",
    icon: Flame,
    blurb:
      "The same loop runs with the heat source active: air is filtered, then warmed at the furnace burner or heat pump coil and distributed through the supply ducts.",
    image: "/images/furnace_1024x576.jpg",
  },
  {
    key: "filtration",
    label: "Air Filtration",
    icon: Wind,
    blurb:
      "Every pass through the system is a cleaning pass. The filter captures dust, pollen, and particles — which is why regular filter changes matter so much for air quality.",
    image: "/images/iaq_1024x576.jpg",
  },
];

const STAGES: {
  label: string;
  icon: IconType;
  detail: string | ((mode: AirflowMode) => string);
}[] = [
  {
    label: "Home",
    icon: Home,
    detail: "Your thermostat calls for comfort, and the cycle begins.",
  },
  {
    label: "Return Air",
    icon: AirVent,
    detail: "Return grilles quietly pull room air back into the system.",
  },
  {
    label: "Filter",
    icon: Filter,
    detail: "Dust, pollen, and particles are captured before air reaches the equipment.",
  },
  {
    label: "Air Handler",
    icon: Fan,
    detail: "The blower drives air through the system at the right volume.",
  },
  {
    label: "Coil",
    icon: Thermometer,
    detail: (mode) =>
      mode === "heating"
        ? "Air is warmed here at the furnace or heat pump coil."
        : mode === "cooling"
          ? "Heat and humidity are pulled out of the air here."
          : "Conditioned air continues on — cleaner with every pass.",
  },
  {
    label: "Supply Air",
    icon: Wind,
    detail: "Sealed ducts carry conditioned air to the supply vents in every room.",
  },
  {
    label: "Room",
    icon: Sofa,
    detail: "Air mixes back into your space — then the loop starts again.",
  },
];

const STEP_MS = 1800;

export function AirflowSection() {
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<AirflowMode>("cooling");
  const [stage, setStage] = useState(0);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);

  const active = MODES.find((m) => m.key === mode)!;
  const stageInfo = STAGES[stage];
  const stageDetail =
    typeof stageInfo.detail === "function" ? stageInfo.detail(mode) : stageInfo.detail;

  // the traveling flow: step through the stages continuously until interaction
  useEffect(() => {
    if (reduced || locked) return;
    const id = setInterval(() => {
      if (!lockedRef.current) setStage((s) => (s + 1) % STAGES.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [reduced, locked]);

  const pickStage = (i: number) => {
    lockedRef.current = true;
    setLocked(true);
    setStage(i);
  };

  return (
    <div>
      {/* mode toggle */}
      <div
        className="mb-6 inline-flex rounded-2xl border border-white/10 bg-white/5 p-1.5"
        role="group"
        aria-label="Airflow mode"
      >
        {MODES.map((m) => (
          <button
            key={m.key}
            onClick={() => setMode(m.key)}
            aria-pressed={mode === m.key}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all",
              mode === m.key ? "bg-gold text-ink shadow-gold" : "text-white/75 hover:text-white"
            )}
          >
            <m.icon className="size-4" aria-hidden />
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        {/* mode photo with Ken Burns */}
        <div className="relative min-h-[280px] overflow-hidden rounded-3xl border border-night-line bg-night-soft sm:min-h-[420px]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={mode}
              className="absolute inset-0"
              initial={reduced ? false : { opacity: 0, scale: 1.03 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? undefined : { opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                className="absolute inset-0"
                initial={reduced ? false : { scale: 1.02 }}
                animate={reduced ? undefined : { scale: 1.1 }}
                transition={{ duration: 16, ease: "linear" }}
              >
                <Image
                  src={active.image}
                  alt={`${active.label} — how air moves through the system`}
                  fill
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover"
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-night via-night/50 to-transparent" />
          <div className="absolute inset-x-5 bottom-5 sm:inset-x-6 sm:bottom-6">
            {/* enter-only swap — never gate content on an exit animation */}
            <motion.p
              key={mode}
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="max-w-xl text-sm leading-relaxed text-white/85 sm:text-[15px]"
            >
              {active.blurb}
            </motion.p>
          </div>
        </div>

        {/* the living journey — air travels the loop stage by stage */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
              The path every breath takes
            </p>
            {!reduced && !locked && (
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-gold/70">
                Following the air…
              </span>
            )}
          </div>

          <ol className="mt-4">
            {STAGES.map((s, i) => {
              const isActive = i === stage;
              const passed = i < stage;
              return (
                <li key={s.label}>
                  <button
                    onClick={() => pickStage(i)}
                    aria-pressed={isActive}
                    className="group flex w-full items-start gap-3.5 text-left"
                  >
                    <div className="flex flex-col items-center self-stretch">
                      <motion.span
                        className={cn(
                          "grid size-9 shrink-0 place-items-center rounded-xl border transition-colors duration-300",
                          isActive
                            ? "border-gold bg-gold text-ink shadow-gold"
                            : passed
                              ? "border-gold/35 bg-gold/10 text-gold"
                              : "border-white/10 bg-white/5 text-white/60 group-hover:border-white/25 group-hover:text-white"
                        )}
                        animate={reduced ? undefined : { scale: isActive ? 1.08 : 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <s.icon className="size-4" aria-hidden />
                      </motion.span>
                      {i < STAGES.length - 1 && (
                        <span className="relative my-1 w-px flex-1 overflow-hidden bg-white/12" aria-hidden>
                          {/* the connector fills as the air passes through */}
                          <motion.span
                            className="absolute left-0 top-0 w-px bg-gold"
                            initial={false}
                            animate={{ height: passed || isActive ? "100%" : "0%" }}
                            transition={{
                              duration: reduced ? 0 : isActive ? STEP_MS / 1000 : 0.3,
                              ease: "linear",
                            }}
                          />
                        </span>
                      )}
                    </div>
                    <div className={cn("pb-4", i === STAGES.length - 1 && "pb-0")}>
                      <p
                        className={cn(
                          "pt-1.5 font-display text-sm font-semibold transition-colors duration-300",
                          isActive ? "text-gold" : passed ? "text-white/85" : "text-white/60 group-hover:text-white/85"
                        )}
                      >
                        {s.label}
                      </p>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.p
                            initial={reduced ? false : { opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={reduced ? undefined : { opacity: 0, height: 0 }}
                            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden text-[12.5px] leading-relaxed text-white/60"
                          >
                            {stageDetail}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
