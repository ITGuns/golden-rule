import { HvacExplorer } from "@/components/three/HvacExplorer";
import { AirflowSection } from "@/components/three/AirflowSection";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRight, Gauge, MousePointerClick, SlidersHorizontal } from "lucide-react";
import type { ComponentType } from "react";

/** Generic-educational facts about the interactive widgets below (not business claims). */
const FACT_CHIPS: { icon: ComponentType<{ className?: string }>; label: string }[] = [
  { icon: MousePointerClick, label: "9 interactive components" },
  { icon: SlidersHorizontal, label: "Cooling · Heating · Filtration modes" },
  { icon: Gauge, label: "Powered by real HVAC principles" },
];

function EyebrowChip({ label }: { label: string }) {
  return <p className="eyebrow !text-gold">{label}</p>;
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-night py-24 text-white">
      {/* section backdrop — blueprint grid, soft corner glows, film grain */}
      <div className="bg-blueprint pointer-events-none absolute inset-0" aria-hidden />
      <div className="pointer-events-none absolute -left-40 top-16 size-[26rem] rounded-full bg-gold/[0.07] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-48 bottom-24 size-[30rem] rounded-full bg-sky-500/[0.06] blur-3xl" aria-hidden />
      <div className="noise-overlay" aria-hidden />

      <div className="container-site relative">
        <Reveal className="max-w-2xl">
          <EyebrowChip label="Interactive · How HVAC works" />
          <h2 className="display mt-5 text-4xl !text-white sm:text-5xl">
            See inside your comfort system.
          </h2>
          <p className="mt-4 leading-relaxed text-white/60">
            Understanding a bit of your system&apos;s basic components — and how air actually moves
            through your home — helps you spot problems early and understand exactly what our
            technicians are doing.
          </p>
        </Reveal>

        <div className="mt-12">
          <HvacExplorer />
        </div>

        {/* slim divider — what powers these experiences */}
        <Reveal className="mt-16">
          <div className="flex items-center justify-center gap-5">
            <span className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-white/15 sm:block" aria-hidden />
            <ul className="flex flex-wrap items-center justify-center gap-2.5">
              {FACT_CHIPS.map((c) => (
                <li
                  key={c.label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12.5px] font-semibold tabular-nums text-white/70 backdrop-blur-md"
                >
                  <c.icon className="size-3.5 text-gold" aria-hidden />
                  {c.label}
                </li>
              ))}
            </ul>
            <span className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-white/15 sm:block" aria-hidden />
          </div>
        </Reveal>

        <div className="mt-16">
          <Reveal>
            <EyebrowChip label="The journey of a single breath" />
            <h3 className="display mt-5 max-w-xl text-3xl !text-white sm:text-4xl">
              Follow the airflow.
            </h3>
          </Reveal>
          <div className="mt-8">
            <AirflowSection />
          </div>
        </div>

        <Reveal className="mt-16 text-center">
          <ButtonLink
            href="/how-hvac-works"
            variant="outline-light"
            size="lg"
            className="group !rounded-full"
          >
            Dive deeper: How HVAC Works
            <ArrowRight
              className="size-4.5 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
