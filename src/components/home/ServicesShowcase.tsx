"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { DIVISIONS } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

const CARDS = [
  {
    key: "RESIDENTIAL" as const,
    index: "01",
    links: [
      { name: "Air Conditioning", href: "/residential/air-conditioning" },
      { name: "Gas Furnaces", href: "/residential/furnaces" },
      { name: "Maintenance", href: "/residential/maintenance" },
    ],
  },
  {
    key: "COMMERCIAL" as const,
    index: "02",
    links: [
      { name: "Cooling", href: "/commercial/commercial-cooling" },
      { name: "Heating", href: "/commercial/commercial-heating" },
      { name: "Refrigeration", href: "/commercial/commercial-refrigeration" },
    ],
  },
  {
    key: "NEW_CONSTRUCTION" as const,
    index: "03",
    links: [{ name: "Construction Projects", href: "/new-construction" }],
  },
];

export function ServicesShowcase() {
  const reduced = useReducedMotion();
  return (
    <section id="services" className="bg-white py-24 sm:py-28">
      <div className="container-site">
        {/* ——— editorial header row ——— */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
            <div>
              <p className="eyebrow">Three divisions to serve you</p>
              <h2 className="display mt-4 max-w-2xl text-4xl sm:text-5xl">
                One contractor for every side of comfort.
              </h2>
            </div>
            <ButtonLink
              href="/residential"
              variant="outline"
              className="group !rounded-full"
            >
              View all services
              <ArrowRight
                className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </ButtonLink>
          </div>
        </Reveal>

        <StaggerGroup className="mt-14 grid gap-6 lg:grid-cols-3">
          {CARDS.map(({ key, index, links }) => {
            const d = DIVISIONS[key];
            return (
              <StaggerItem key={key} className="h-full">
                {/* Card is a positioned div; the main CTA stretches over it via an
                    ::after overlay while quick-link chips sit above on z-10 — so
                    there are no nested anchors and every link stays keyboardable. */}
                <motion.article
                  whileHover={reduced ? undefined : { y: -6 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-[0_2px_14px_rgb(0_0_0/0.05)] transition-[border-color,box-shadow] duration-300 hover:border-gold/40 hover:shadow-lift focus-within:border-gold/40"
                >
                  {/* ——— imagery ——— */}
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={d.image}
                      alt={`${d.label} HVAC services`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                    />
                    {/* base gradient + a deeper layer that fades in on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/10 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* ghosted index numeral */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-4 right-3 select-none font-display text-[6.5rem] font-bold leading-none tracking-tight text-white/15 tabular-nums transition-colors duration-500 group-hover:text-gold/25"
                    >
                      {index}
                    </span>

                    {/* gold icon tile + division name */}
                    <div className="absolute bottom-4 left-5 flex items-center gap-3">
                      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gold shadow-gold transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-rotate-6 group-hover:scale-105">
                        <Image src={d.icon} alt="" width={28} height={28} />
                      </span>
                      <h3 className="font-display text-2xl font-bold text-white">
                        {d.label}
                      </h3>
                    </div>
                  </div>

                  {/* ——— body ——— */}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-[15px] leading-relaxed text-body">{d.blurb}</p>

                    {/* quick-link chips — above the stretched overlay */}
                    <nav
                      aria-label={`Popular ${d.label.toLowerCase()} services`}
                      className="relative z-10 mt-5 flex flex-wrap gap-2"
                    >
                      {links.map((l) => (
                        <Link
                          key={l.href}
                          href={l.href}
                          className="inline-flex items-center rounded-full border border-line bg-paper px-3.5 py-1.5 text-[12.5px] font-semibold text-body transition-colors duration-200 hover:border-gold/60 hover:bg-gold-soft hover:text-ink"
                        >
                          {l.name}
                        </Link>
                      ))}
                    </nav>

                    {/* main CTA — stretched over the whole card via ::after */}
                    <div className="mt-auto pt-6">
                      <Link
                        href={d.href}
                        className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-ink transition-colors duration-200 group-hover:text-gold-deep after:absolute after:inset-0 after:content-['']"
                      >
                        Explore {d.label.toLowerCase()}
                        <ArrowRight
                          className="size-4 text-gold-deep transition-transform duration-300 group-hover:translate-x-1.5"
                          aria-hidden
                        />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              </StaggerItem>
            );
          })}
        </StaggerGroup>
      </div>
    </section>
  );
}
