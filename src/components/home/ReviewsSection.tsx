"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { formatDate, initials } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  title: string | null;
  text: string;
  customerName: string;
  rating: number;
  serviceDate: string | null;
};

const AUTO_MS = 7000;

export function ReviewsSection({ reviews }: { reviews: ReviewItem[] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  // auto-advance until the visitor navigates manually — then stay manual
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (reduced || !auto || reviews.length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % reviews.length), AUTO_MS);
    return () => clearInterval(id);
  }, [reduced, auto, reviews.length]);

  if (reviews.length === 0) return null;

  const review = reviews[index % reviews.length];
  const go = (dir: 1 | -1) => {
    setAuto(false);
    setIndex((i) => (i + dir + reviews.length) % reviews.length);
  };
  const jump = (i: number) => {
    setAuto(false);
    setIndex(i);
  };
  const fillAnimates = !reduced && auto && reviews.length > 1;

  return (
    <section className="relative overflow-hidden bg-night py-24 text-white sm:py-28">
      {/* ——— cinema backdrop: blueprint grid, corner glows, film grain ——— */}
      <div className="bg-blueprint absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute -top-40 right-[-12%] h-[30rem] w-[42rem]"
        style={{
          background: "radial-gradient(closest-side, rgb(252 205 53 / 0.10), transparent 72%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-48 left-[-10%] h-[26rem] w-[36rem]"
        style={{
          background: "radial-gradient(closest-side, rgb(96 141 220 / 0.08), transparent 72%)",
        }}
        aria-hidden
      />
      <div className="noise-overlay" aria-hidden />

      <div className="container-site relative z-10">
        <Reveal className="flex flex-col items-center text-center">
          <p className="eyebrow !text-gold">Real customers, real words</p>
          <h2 className="display mt-4 text-4xl !text-white sm:text-5xl">
            The Golden Rule, kept.
          </h2>
        </Reveal>

        <div className="relative mx-auto mt-12 max-w-3xl">
          <Quote className="absolute -top-6 left-0 size-12 text-gold/25" aria-hidden />
          <div className="min-h-[240px]">
            <AnimatePresence mode="wait">
              <motion.figure
                key={review.id}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: reduced ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                {/* stars stagger-pop as each review enters */}
                <div
                  className="flex justify-center gap-1"
                  role="img"
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="inline-flex"
                      initial={reduced ? false : { opacity: 0, scale: 0.4 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.35,
                        delay: reduced ? 0 : 0.1 + i * 0.06,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      aria-hidden
                    >
                      <Star className="size-5 fill-gold text-gold" />
                    </motion.span>
                  ))}
                </div>

                <blockquote className="mt-5 text-lg leading-relaxed text-white/85 sm:text-xl">
                  {review.text.length > 420 ? review.text.slice(0, 420).trimEnd() + "…" : review.text}
                </blockquote>

                <figcaption className="mt-6">
                  {review.title && (
                    <p className="font-display font-bold text-gold">{review.title}</p>
                  )}
                  {/* reviewer identity row */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-center gap-3">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-soft font-display text-[13px] font-bold text-ink"
                      aria-hidden
                    >
                      {initials(review.customerName)}
                    </span>
                    <span className="text-left leading-tight">
                      <span className="block font-display text-[15px] font-bold text-white">
                        {review.customerName}
                      </span>
                      {review.serviceDate && (
                        <span className="block text-xs tabular-nums text-white/50">
                          {formatDate(review.serviceDate)}
                        </span>
                      )}
                    </span>
                    <Badge tone="gold" className="border border-gold/30 !bg-gold/15 !text-gold">
                      Website review
                    </Badge>
                  </div>
                </figcaption>
              </motion.figure>
            </AnimatePresence>
          </div>

          {/* ——— controls: arrows + segmented progress (hero pattern) ——— */}
          <div className="mt-8 flex items-center justify-center gap-5">
            <button
              onClick={() => go(-1)}
              aria-label="Previous review"
              className="rounded-full border border-white/20 p-2.5 text-white/70 transition-colors duration-300 hover:border-gold hover:text-gold"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>

            <div
              className="flex max-w-[16rem] flex-wrap items-center justify-center gap-1.5"
              role="tablist"
              aria-label="Reviews"
            >
              {reviews.map((r, i) => (
                <button
                  key={r.id}
                  role="tab"
                  aria-selected={i === index % reviews.length}
                  aria-label={`Show review ${i + 1} of ${reviews.length}`}
                  onClick={() => jump(i)}
                  className="relative h-1 w-8 overflow-hidden rounded-full bg-white/20"
                >
                  {i === index % reviews.length && (
                    <motion.span
                      key={`fill-${index}`}
                      className="absolute inset-y-0 left-0 rounded-full bg-gold"
                      initial={{ width: fillAnimates ? "0%" : "100%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: fillAnimates ? AUTO_MS / 1000 : 0,
                        ease: "linear",
                      }}
                    />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => go(1)}
              aria-label="Next review"
              className="rounded-full border border-white/20 p-2.5 text-white/70 transition-colors duration-300 hover:border-gold hover:text-gold"
            >
              <ChevronRight className="size-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="mt-10 text-center">
          <ButtonLink href="/reviews" variant="outline-light" className="group !rounded-full">
            Read all reviews
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
