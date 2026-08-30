"use client";

import { useState } from "react";
import { SceneCanvas } from "./SceneCanvas";
import { AirflowScene, type AirflowMode } from "./AirflowScene";
import { cn } from "@/lib/utils";
import { Snowflake, Flame, Wind } from "lucide-react";

const MODES: { key: AirflowMode; label: string; icon: typeof Snowflake; blurb: string }[] = [
  {
    key: "cooling",
    label: "Cooling",
    icon: Snowflake,
    blurb:
      "Warm air is pulled through the return, filtered, then passes over the cold evaporator coil where heat and humidity are removed before cool air is supplied back to every room.",
  },
  {
    key: "heating",
    label: "Heating",
    icon: Flame,
    blurb:
      "The same loop runs in reverse priority: air is filtered, then warmed at the heat source (furnace burner or heat pump coil) and distributed through the supply ducts.",
  },
  {
    key: "filtration",
    label: "Air Filtration",
    icon: Wind,
    blurb:
      "Every pass through the system is a cleaning pass. The filter captures dust, pollen, and particles — which is why regular filter changes matter so much for air quality.",
  },
];

const STAGES = ["Home", "Return Air", "Filter", "Air Handler", "Coil", "Supply Air", "Room"];

export function AirflowSection() {
  const [mode, setMode] = useState<AirflowMode>("cooling");
  const active = MODES.find((m) => m.key === mode)!;

  return (
    <div>
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

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-3xl border border-night-line bg-night">
          <SceneCanvas
            className="h-[380px] w-full sm:h-[460px]"
            camera={{ position: [0, 0.3, 6.4], fov: 44 }}
            fallback={
              <div className="flex h-full items-center justify-center p-8 text-center text-sm text-white/60">
                Airflow animation — home → return air → filter → air handler →
                coil → supply air → room.
              </div>
            }
          >
            <AirflowScene mode={mode} />
          </SceneCanvas>
        </div>

        <div className="flex flex-col justify-center">
          <ol className="relative space-y-0 border-l border-white/15 pl-5">
            {STAGES.map((s, i) => (
              <li key={s} className="relative pb-3.5 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[26px] top-1 grid size-3 place-items-center rounded-full",
                    i === 4 ? "bg-gold" : "bg-white/30"
                  )}
                  aria-hidden
                />
                <span className="font-display text-sm font-semibold tracking-wide text-white/85">
                  {s}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm leading-relaxed text-white/60">{active.blurb}</p>
        </div>
      </div>
    </div>
  );
}
