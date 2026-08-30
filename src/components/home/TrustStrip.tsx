"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { CERTIFICATIONS } from "@/lib/site";
import { Wrench, Building2, HardHat, Home, Clock3, BadgeCheck } from "lucide-react";
import type { ComponentType } from "react";

type IconType = ComponentType<{ className?: string }>;

/** Verified-facts trust bar directly below the hero. */
const ITEMS: { icon: IconType; label: string }[] = [
  { icon: Wrench, label: "Full-Service HVAC Contractor" },
  { icon: Home, label: "Residential" },
  { icon: Building2, label: "Commercial" },
  { icon: HardHat, label: "New Construction" },
  { icon: BadgeCheck, label: "Certified Professional Team" },
  { icon: Clock3, label: "Emergency Service Available" },
];

function TrustChip({ icon: Icon, label }: { icon: IconType; label: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border border-line bg-white py-1.5 pl-2 pr-4 text-[13.5px] font-semibold text-body shadow-[0_2px_12px_rgb(10_11_13/0.05)]">
      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-gold-soft text-gold-deep">
        <Icon className="size-3.5" aria-hidden />
      </span>
      {label}
    </span>
  );
}

export function TrustStrip() {
  const reduced = useReducedMotion();

  return (
    <section id="trust" aria-label="Why trust Golden Rule" className="border-b border-line bg-white">
      {/* ——— top band: seamless trust marquee ——— */}
      {reduced ? (
        <div className="container-site flex flex-wrap items-center justify-center gap-3 py-6">
          {ITEMS.map((item) => (
            <TrustChip key={item.label} icon={item.icon} label={item.label} />
          ))}
        </div>
      ) : (
        <div className="group relative overflow-hidden py-6">
          {/* edge fades */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-28"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-28"
          />
          {/* 4 identical groups → -50% translate loops seamlessly; hover pauses */}
          <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
            {[0, 1, 2, 3].map((g) => (
              <div
                key={g}
                aria-hidden={g > 0 ? true : undefined}
                className="flex shrink-0 items-center gap-3 pr-3"
              >
                {ITEMS.map((item) => (
                  <TrustChip key={item.label} icon={item.icon} label={item.label} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ——— bottom band: certifications & memberships ——— */}
      <div className="border-t border-line bg-paper">
        <div className="container-site flex flex-col items-center gap-4 py-7 lg:flex-row lg:justify-center lg:gap-10">
          <span className="shrink-0 font-display text-[11px] font-bold uppercase tracking-[0.22em] text-muted">
            Certifications &amp; Memberships
          </span>
          <ul className="flex flex-wrap items-center justify-center gap-3">
            {CERTIFICATIONS.map((c) => (
              <li key={c.key}>
                {c.image ? (
                  <span
                    title={c.label}
                    className="flex h-14 items-center justify-center rounded-2xl border border-line bg-white px-4 transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lift"
                  >
                    <Image
                      src={c.image}
                      alt={c.label}
                      width={80}
                      height={36}
                      className="h-7 w-auto object-contain"
                    />
                  </span>
                ) : (
                  <span
                    title={c.label}
                    className="flex h-14 items-center justify-center rounded-2xl border border-line bg-white px-4 font-display text-sm font-bold tracking-wide text-muted transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-lift"
                  >
                    {c.key}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
