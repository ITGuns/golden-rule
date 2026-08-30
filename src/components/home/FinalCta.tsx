"use client";

import { motion, useReducedMotion } from "framer-motion";
import { COMPANY } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { track } from "@/lib/analytics-client";
import { ArrowRight, Clock3, MapPin, PhoneCall, ShieldCheck } from "lucide-react";

/** Verified facts only — license, emergency availability, founding year. */
const FACTS = [
  { icon: ShieldCheck, label: `License ${COMPANY.license}` },
  { icon: Clock3, label: COMPANY.emergencyNote },
  { icon: MapPin, label: `Serving Greater Houston since ${COMPANY.founded}` },
] as const;

export function FinalCta() {
  const reduced = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-gold py-24 sm:py-28">
      {/* engineering grid texture */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.07]"
        aria-hidden
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
            <path d="M 42 0 L 0 0 0 42" fill="none" stroke="#000" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* soft radial ink glow, top-right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-44 size-[30rem] rounded-full bg-[radial-gradient(closest-side,rgb(10_11_13/0.16),transparent_72%)]"
      />

      {/* very subtle shine sweep across the band */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-[-30%] left-0 w-40 rotate-[14deg] bg-gradient-to-r from-transparent via-white/20 to-transparent sm:w-64"
          animate={{ x: ["-30vw", "130vw"] }}
          transition={{ duration: 9, ease: "linear", repeat: Infinity, repeatDelay: 5 }}
        />
      )}

      <div className="container-site relative text-center">
        <Reveal>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.26em] text-ink/70">
            Ready when you are
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <h2 className="display mx-auto mt-6 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">
            Ready when your comfort can&apos;t wait.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink/70">
            Request service online in under two minutes, or talk to a Comfort Specialist right now.
          </p>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <ButtonLink
              href="/request-service"
              variant="dark"
              size="lg"
              className="group !rounded-full"
              onClick={() => track("cta_click", { cta: "final-cta-request-service" })}
            >
              Request Service
              <ArrowRight
                className="size-4.5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </ButtonLink>
            <PhoneLink
              label="final-cta"
              showIcon={false}
              className="group/phone gap-3 rounded-full border-2 border-ink py-2.5 pl-3 pr-7 font-display text-lg font-bold text-ink transition-all duration-300 hover:-translate-y-0.5 hover:bg-ink hover:text-gold"
            >
              <span className="grid size-9 place-items-center rounded-full bg-ink text-gold transition-colors duration-300 group-hover/phone:bg-gold group-hover/phone:text-ink">
                <PhoneCall className="size-4" aria-hidden />
              </span>
              {COMPANY.phone}
            </PhoneLink>
          </div>

          {/* slim verified-facts row */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
            {FACTS.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-ink/10 px-3.5 py-1.5 text-[12px] font-semibold tracking-wide text-ink/70"
              >
                <f.icon className="size-3.5 text-ink/60" aria-hidden />
                {f.label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
