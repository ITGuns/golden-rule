"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cinematic photo carousel through the components of a home comfort system.
 * Auto-advances until the visitor interacts; each slide drifts (Ken Burns)
 * and slides directionally. Selecting from the list jumps straight there.
 */

type HvacPartKey =
  | "thermostat"
  | "return"
  | "filter"
  | "handler"
  | "coil"
  | "duct"
  | "supply"
  | "compressor"
  | "condenser";

const HVAC_PARTS: Record<
  HvacPartKey,
  { name: string; blurb: string; image: string }
> = {
  thermostat: {
    name: "Thermostat",
    blurb:
      "The control center of your comfort system. It senses indoor temperature and tells the system when to heat, cool, or rest.",
    image: "/images/zone_control_1024x576.jpg",
  },
  return: {
    name: "Return Air",
    blurb:
      "Warm indoor air returns to the system where it is filtered and conditioned before being distributed back through your home.",
    image: "/images/AC_A_008-ac-unit-blowing-hot-air-1.jpg",
  },
  filter: {
    name: "Filter",
    blurb:
      "As air enters the system it passes through the filter, which captures dust, pollen, and airborne particles — protecting your air quality and the equipment itself.",
    image: "/images/iaq_1024x576.jpg",
  },
  handler: {
    name: "Air Handler",
    blurb:
      "The indoor unit that houses the blower. It pulls air across the coil and pushes conditioned air through the duct system.",
    image: "/images/furnace_1024x576.jpg",
  },
  coil: {
    name: "Evaporator Coil",
    blurb:
      "Cold refrigerant flowing through the evaporator coil absorbs heat from indoor air, cooling and dehumidifying it in the process.",
    image: "/images/AC_A_029-How-Your-AC-Cools-Your-Home-2-e1628799548613.jpg",
  },
  duct: {
    name: "Ductwork",
    blurb:
      "A network of sealed passages that distributes conditioned air evenly to every room. Leaky ducts waste energy — sealed ducts deliver the comfort you paid for.",
    image: "/images/ductwork_1024x576.jpg",
  },
  supply: {
    name: "Supply Air",
    blurb:
      "Conditioned air is delivered back into your living spaces through supply vents, keeping every room at the temperature you chose.",
    image: "/images/ductless_1024x576.jpg",
  },
  compressor: {
    name: "Compressor",
    blurb:
      "The heart of the refrigeration cycle. It pressurizes refrigerant so heat collected indoors can be moved and released outside.",
    image: "/images/Four-signs-need-AC-maintenance.jpg",
  },
  condenser: {
    name: "Condenser",
    blurb:
      "The outdoor coil. Refrigerant releases the heat it absorbed indoors as outside air is drawn across the condenser by the fan.",
    image: "/images/air_conditioner_1024x576.jpg",
  },
};

const ORDER: HvacPartKey[] = [
  "thermostat",
  "return",
  "filter",
  "handler",
  "coil",
  "duct",
  "supply",
  "compressor",
  "condenser",
];

const AUTO_MS = 5000;

export function HvacExplorer() {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);

  const key = ORDER[index];
  const part = HVAC_PARTS[key];

  // auto-advance until first interaction
  useEffect(() => {
    if (reduced || locked) return;
    const id = setInterval(() => {
      if (!lockedRef.current) {
        setDir(1);
        setIndex((i) => (i + 1) % ORDER.length);
      }
    }, AUTO_MS);
    return () => clearInterval(id);
  }, [reduced, locked]);

  const goTo = (i: number, manual = true) => {
    setDir(i > index || (i === 0 && index === ORDER.length - 1) ? 1 : -1);
    setIndex((i + ORDER.length) % ORDER.length);
    if (manual) {
      lockedRef.current = true;
      setLocked(true);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      {/* ——— photo carousel ——— */}
      <div className="group relative min-h-[320px] overflow-hidden rounded-3xl border border-night-line bg-night-soft sm:min-h-[460px]">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={key}
            className="absolute inset-0"
            custom={dir}
            initial={reduced ? false : { opacity: 0, x: dir * 56 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduced ? undefined : { opacity: 0, x: dir * -56 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Ken Burns drift while the slide is active */}
            <motion.div
              className="absolute inset-0"
              initial={reduced ? false : { scale: 1.02 }}
              animate={reduced ? undefined : { scale: 1.1 }}
              transition={{ duration: AUTO_MS / 1000 + 2, ease: "linear" }}
            >
              <Image
                src={part.image}
                alt={part.name}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* scrims */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-night via-night/60 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-night/60 to-transparent" />

        {/* auto-advance progress hairline */}
        {!reduced && !locked && (
          <motion.span
            key={`progress-${key}`}
            className="absolute left-0 top-0 z-10 h-[3px] bg-gold"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: AUTO_MS / 1000, ease: "linear" }}
            aria-hidden
          />
        )}

        {/* counter chip */}
        <span className="absolute left-5 top-4 z-10 rounded-lg bg-night/60 px-2.5 py-1 font-display text-[11px] font-bold tabular-nums tracking-[0.18em] text-white/80 backdrop-blur-md">
          {String(index + 1).padStart(2, "0")} / {String(ORDER.length).padStart(2, "0")}
        </span>

        {/* prev / next */}
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <button
            onClick={() => goTo(index - 1)}
            aria-label="Previous component"
            className="grid size-9 place-items-center rounded-full border border-white/15 bg-night/50 text-white/80 backdrop-blur-md transition-colors hover:border-gold hover:text-gold"
          >
            <ChevronLeft className="size-4.5" aria-hidden />
          </button>
          <button
            onClick={() => goTo(index + 1)}
            aria-label="Next component"
            className="grid size-9 place-items-center rounded-full border border-white/15 bg-night/50 text-white/80 backdrop-blur-md transition-colors hover:border-gold hover:text-gold"
          >
            <ChevronRight className="size-4.5" aria-hidden />
          </button>
        </div>

        {/* explanation card */}
        <div className="absolute inset-x-5 bottom-5 z-10 sm:inset-x-6 sm:bottom-6">
          {/* enter-only swap — never gate content on an exit animation */}
          <motion.div
            key={key}
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1 }}
          >
            <p className="font-display text-sm font-bold uppercase tracking-[0.16em] text-gold">
              {part.name}
            </p>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-white/85 sm:text-[15px]">
              {part.blurb}
            </p>
          </motion.div>
        </div>
      </div>

      {/* ——— component list ——— */}
      <div>
        <p className="eyebrow !text-gold mb-3">Select a component</p>
        <div
          className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5"
          role="group"
          aria-label="HVAC system components"
        >
          {ORDER.map((k, i) => (
            <button
              key={k}
              onClick={() => goTo(i)}
              aria-pressed={key === k}
              className={cn(
                "rounded-xl px-4 py-2 text-left text-sm font-semibold transition-all duration-200",
                key === k
                  ? "bg-gold text-ink shadow-gold"
                  : "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {HVAC_PARTS[k].name}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/45">
          The tour advances on its own — pick any component to jump in and take
          over.
        </p>
      </div>
    </div>
  );
}
