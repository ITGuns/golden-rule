"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BRANDS } from "@/lib/site";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

type Brand = (typeof BRANDS)[number];

/** One logo tile — white card that lifts and picks up a gold border on hover. */
function BrandTile({
  brand,
  decorative = false,
  onEnter,
  onLeave,
}: {
  brand: Brand;
  /** true for the duplicated marquee copy — hidden from assistive tech */
  decorative?: boolean;
  onEnter?: () => void;
  onLeave?: () => void;
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="group/tile w-40 shrink-0 rounded-2xl border border-line bg-white p-5 transition-all duration-300 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-gold hover:shadow-lift"
    >
      <Image
        src={brand.logo}
        alt={decorative ? "" : brand.name}
        width={120}
        height={120}
        className="aspect-square w-full object-contain transition-transform duration-300 group-hover/tile:scale-[1.05]"
      />
    </div>
  );
}

/**
 * A seamless marquee row: the track holds the brand list twice and the theme
 * `marquee` keyframes translate it 0 → -50%, so the loop never shows a seam.
 * The reverse row runs on the same keyframes, slower and in the other
 * direction, for a two-speed pass. Hovering the marquee block pauses both.
 */
function MarqueeRow({
  brands,
  reverse = false,
  onEnter,
  onLeave,
}: {
  brands: readonly Brand[];
  reverse?: boolean;
  onEnter: (name: string) => void;
  onLeave: () => void;
}) {
  return (
    <div className="flex overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div
        className={cn(
          "flex w-max group-hover/marquee:[animation-play-state:paused]",
          reverse
            ? "[animation:marquee_52s_linear_infinite_reverse]"
            : "animate-marquee"
        )}
      >
        {[0, 1].map((copy) => (
          <div
            key={copy}
            className="flex gap-4 pr-4"
            aria-hidden={copy === 1 || undefined}
          >
            {brands.map((b) => (
              <BrandTile
                key={b.name}
                brand={b}
                decorative={copy === 1}
                onEnter={() => onEnter(b.name)}
                onLeave={onLeave}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function BrandsSection() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState<string | null>(null);
  const brand = BRANDS.find((b) => b.name === active);
  const rowTwo = [...BRANDS].reverse();

  return (
    <section className="overflow-hidden border-y border-line bg-white py-20">
      <div className="container-site">
        <Reveal className="flex flex-col items-center text-center">
          <p className="eyebrow">Products</p>
          <h2 className="display mt-4 text-3xl sm:text-4xl">We service all brands.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            With access to all major equipment manufacturers, we recommend the best fit for your
            home or business — never a one-brand-fits-all answer.
          </p>
        </Reveal>

        {/* desktop: two-speed double marquee (hidden when reduced motion is on) */}
        {!reduced && (
          <div className="group/marquee mt-10 hidden flex-col gap-2 md:flex">
            <MarqueeRow
              brands={BRANDS}
              onEnter={(name) => setActive(name)}
              onLeave={() => setActive(null)}
            />
            <MarqueeRow
              brands={rowTwo}
              reverse
              onEnter={(name) => setActive(name)}
              onLeave={() => setActive(null)}
            />

            <div className="flex h-8 items-center justify-center" aria-live="polite">
              <AnimatePresence mode="wait">
                {brand && (
                  <motion.p
                    key={brand.name}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="font-display text-sm font-bold tracking-wide text-ink"
                  >
                    {brand.name} — installation, service &amp; repair
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* mobile always, and desktop under reduced motion: static wrapped grid */}
        <div
          className={cn(
            "mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4",
            reduced ? "md:gap-4 lg:grid-cols-8" : "md:hidden"
          )}
        >
          {BRANDS.map((b) => (
            <div
              key={b.name}
              className="rounded-2xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-lift"
            >
              <Image
                src={b.logo}
                alt={b.name}
                width={110}
                height={110}
                className="aspect-square w-full object-contain"
              />
              <p className="mt-2 text-center text-xs font-semibold text-muted">{b.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
