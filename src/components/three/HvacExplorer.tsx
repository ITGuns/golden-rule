"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SceneCanvas } from "./SceneCanvas";
import { HvacExplorerScene, HVAC_PARTS, type HvacPartKey } from "./HvacExplorerScene";
import { cn } from "@/lib/utils";

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

export function HvacExplorer() {
  const [selected, setSelected] = useState<HvacPartKey | null>(null);
  const part = selected ? HVAC_PARTS[selected] : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="relative overflow-hidden rounded-3xl border border-night-line bg-night">
        <SceneCanvas
          className="h-[420px] w-full sm:h-[520px]"
          camera={{ position: [0, 1.5, 7.2], fov: 42 }}
          fallback={
            <div className="flex h-full items-center justify-center p-8 text-center text-sm text-white/60">
              Interactive 3D system diagram (enable motion to explore) — select a
              component from the list to read how it works.
            </div>
          }
        >
          <HvacExplorerScene selected={selected} onSelect={setSelected} />
        </SceneCanvas>

        <AnimatePresence>
          {part && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-night/85 p-4 backdrop-blur-md sm:inset-x-auto sm:right-4 sm:max-w-sm"
            >
              <p className="font-display text-sm font-semibold uppercase tracking-wider text-gold">
                {part.name}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/85">{part.blurb}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div>
        <p className="eyebrow mb-3">Select a component</p>
        <div className="flex flex-wrap gap-2 lg:flex-col lg:gap-1.5" role="group" aria-label="HVAC system components">
          {ORDER.map((key) => (
            <button
              key={key}
              onClick={() => setSelected(selected === key ? null : key)}
              aria-pressed={selected === key}
              className={cn(
                "rounded-xl px-4 py-2 text-left text-sm font-semibold transition-all",
                selected === key
                  ? "bg-gold text-ink shadow-gold"
                  : "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              {HVAC_PARTS[key].name}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-white/45">
          Click a component in the diagram or the list — the camera moves to it
          and explains its role in your comfort system.
        </p>
      </div>
    </div>
  );
}
