"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import { MagneticButton } from "@/components/motion/MagneticButton";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { COMPANY } from "@/lib/site";
import { track } from "@/lib/analytics-client";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Clock3,
  ShieldCheck,
  ThermometerSun,
} from "lucide-react";
import type { ReactNode } from "react";

/**
 * Cinematic slideshow hero built from the company's real photography — each
 * slide cross-fades with a slow Ken Burns drift so it reads like footage.
 * Drop a looping clip at /public/media/hero-loop.mp4 and the hero
 * automatically upgrades to video (first slide stays as poster/fallback).
 */
const SLIDES = [
  {
    src: "/images/iStock-973631576.jpg",
    label: "Residential Service",
    position: "object-[68%_center]",
  },
  {
    src: "/images/Four-signs-need-AC-maintenance-scaled.jpg",
    label: "Repair & Installation",
    position: "object-[72%_30%]",
  },
  {
    src: "/images/commercial_ac_2050x700.jpg",
    label: "Commercial HVAC",
    position: "object-center",
  },
  {
    src: "/images/AdobeStock_55623389.jpg",
    label: "New Construction",
    position: "object-center",
  },
  {
    src: "/images/maintenance_2050x700.jpg",
    label: "GoldStandard™ Maintenance",
    position: "object-[40%_center]",
  },
] as const;

const SLIDE_MS = 6500;
const HERO_VIDEO = "/media/hero-loop.mp4";

/** Word-by-word masked rise for the headline. */
function RevealWord({
  children,
  delay,
  className,
}: {
  children: ReactNode;
  delay: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
      <motion.span
        className={className ? `inline-block ${className}` : "inline-block"}
        initial={reduced ? false : { y: "112%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Verified credentials rendered as the hero's base trust bar. */
const TRUST_ITEMS = [
  {
    icon: BadgeCheck,
    label: "NATE Certified",
    sub: "North American Technician Excellence",
  },
  {
    icon: ShieldCheck,
    label: `License ${COMPANY.license}`,
    sub: "Texas HVAC contractor",
  },
  {
    icon: Clock3,
    label: "24/7 Emergency Service",
    sub: "281-500-RUSH (7874)",
  },
  {
    icon: ThermometerSun,
    label: `Est. ${COMPANY.founded} · Houston`,
    sub: "Residential · Commercial · New Construction",
  },
];

export function Hero() {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [slide, setSlide] = useState(0);

  // advance the slideshow (paused for reduced motion or once video takes over)
  useEffect(() => {
    if (reduced || videoReady) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [reduced, videoReady]);

  // media parallax against scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const mediaY = useTransform(scrollYProgress, [0, 1], ["0%", "16%"]);
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);

  // cursor spotlight
  const mx = useMotionValue(-600);
  const my = useMotionValue(-600);
  const sx = useSpring(mx, { stiffness: 90, damping: 22 });
  const sy = useSpring(my, { stiffness: 90, damping: 22 });
  const spotlight = useMotionTemplate`radial-gradient(560px circle at ${sx}px ${sy}px, rgb(252 205 53 / 0.09), transparent 70%)`;

  const fadeUp = (delay: number) => ({
    initial: reduced ? undefined : { opacity: 0, y: 26 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <section
      ref={sectionRef}
      onMouseMove={(e) => {
        if (reduced) return;
        const rect = sectionRef.current?.getBoundingClientRect();
        mx.set(e.clientX - (rect?.left ?? 0));
        my.set(e.clientY - (rect?.top ?? 0));
      }}
      className="relative flex min-h-[100svh] items-center overflow-hidden bg-night"
    >
      {/* ——— media layer: cross-fading Ken Burns slideshow ——— */}
      <motion.div
        className="absolute inset-0"
        style={reduced ? undefined : { y: mediaY, scale: mediaScale }}
        aria-hidden
      >
        {SLIDES.map((s, i) => {
          const active = i === slide && !videoReady;
          return (
            <motion.div
              key={s.src}
              className="absolute inset-0"
              initial={false}
              animate={{ opacity: active || (reduced && i === 0) ? 1 : 0 }}
              transition={{ duration: reduced ? 0 : 1.4, ease: "easeInOut" }}
            >
              <motion.div
                className="absolute inset-0"
                initial={false}
                animate={
                  reduced
                    ? undefined
                    : active
                      ? { scale: 1.12, x: "-1.2%" }
                      : { scale: 1.04, x: "0%" }
                }
                transition={{ duration: SLIDE_MS / 1000 + 2, ease: "linear" }}
              >
                <Image
                  src={s.src}
                  alt=""
                  fill
                  priority={i === 0}
                  loading={i === 0 ? undefined : "eager"}
                  sizes="100vw"
                  quality={80}
                  className={`object-cover ${s.position}`}
                />
              </motion.div>
            </motion.div>
          );
        })}

        {/* optional video upgrade — activates when /media/hero-loop.mp4 exists */}
        {!reduced && !videoFailed && (
          <video
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              videoReady ? "opacity-100" : "opacity-0"
            }`}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={SLIDES[0].src}
            src={HERO_VIDEO}
            onCanPlay={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
          />
        )}
      </motion.div>

      {/* ——— readability scrims ——— */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-night via-night/80 to-night/20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-night/80 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-night to-transparent" />

      {/* cursor spotlight */}
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{ background: spotlight }}
          aria-hidden
        />
      )}

      {/* film grain */}
      <div className="noise-overlay" aria-hidden />

      <div className="container-site relative z-10 pb-40 pt-32 lg:pb-48">
        <div className="max-w-2xl">
          <h1 className="display text-5xl leading-[1.05] !text-white sm:text-6xl lg:text-7xl">
            <RevealWord delay={0.15}>Comfort</RevealWord>{" "}
            <RevealWord delay={0.26}>Engineered</RevealWord>
            <br />
            <RevealWord delay={0.4} className="text-shimmer-gold">
              Around You.
            </RevealWord>
          </h1>

          <motion.p
            {...fadeUp(0.55)}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/80"
          >
            Trusted heating and cooling solutions for homes, businesses, and new
            construction across Houston.
          </motion.p>

          <motion.div {...fadeUp(0.68)} className="mt-9 flex flex-wrap items-center gap-4">
            <MagneticButton>
              <ButtonLink
                href="/request-service"
                size="lg"
                className="group !rounded-full"
                onClick={() => track("cta_click", { cta: "hero-request-service" })}
              >
                Request Service
                <ArrowRight
                  className="size-4.5 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </ButtonLink>
            </MagneticButton>
            <ButtonLink
              href="/#services"
              variant="outline-light"
              size="lg"
              className="!rounded-full backdrop-blur-sm"
              onClick={() => track("cta_click", { cta: "hero-explore" })}
            >
              Explore Our Services
            </ButtonLink>
          </motion.div>

          <motion.div {...fadeUp(0.8)} className="mt-9">
            <PhoneLink
              label="hero-emergency"
              showIcon={false}
              className="group inline-flex items-center gap-3 rounded-2xl border border-white/12 bg-night/40 py-2.5 pl-3 pr-5 backdrop-blur-md transition-colors hover:border-red-400/40"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-red-500/15 text-red-400 transition-colors group-hover:bg-red-500/25">
                <AlertTriangle className="size-4" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-red-400">
                  Emergency Service
                </span>
                <span className="font-display text-lg font-bold text-white transition-colors group-hover:text-gold">
                  281-500-7874
                </span>
              </span>
            </PhoneLink>
          </motion.div>
        </div>
      </div>

      {/* slideshow rail — vertical label + progress segments on the right edge */}
      {!videoReady && (
        <motion.div
          {...fadeUp(1.1)}
          className="absolute right-5 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-4 xl:flex"
        >
          <motion.p
            key={SLIDES[slide].label}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-[10.5px] font-bold uppercase tracking-[0.22em] text-gold [writing-mode:vertical-rl]"
          >
            {SLIDES[slide].label}
          </motion.p>
          <div className="flex flex-col gap-1.5" role="tablist" aria-label="Hero slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.src}
                role="tab"
                aria-selected={i === slide}
                aria-label={`Show slide: ${s.label}`}
                onClick={() => setSlide(i)}
                className="relative h-9 w-1 overflow-hidden rounded-full bg-white/20"
              >
                {i === slide && (
                  <motion.span
                    key={`fill-${slide}`}
                    className="absolute inset-x-0 top-0 rounded-full bg-gold"
                    initial={{ height: reduced ? "100%" : "0%" }}
                    animate={{ height: "100%" }}
                    transition={{ duration: reduced ? 0 : SLIDE_MS / 1000, ease: "linear" }}
                  />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* architectural trust bar anchored to the hero base */}
      <motion.div
        {...fadeUp(1.0)}
        className="absolute inset-x-0 bottom-0 z-10 hidden border-t border-white/10 bg-night/40 backdrop-blur-lg lg:block"
      >
        <div className="container-site">
          <div className="grid grid-cols-[repeat(4,1fr)_auto] divide-x divide-white/[0.07]">
            {TRUST_ITEMS.map((c) => (
              <div
                key={c.label}
                className="flex items-center gap-3.5 py-4 pr-5 [&:not(:first-child)]:pl-5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                  <c.icon className="size-[18px]" aria-hidden />
                </span>
                <span className="leading-tight">
                  <span className="block font-display text-[13px] font-bold text-white">
                    {c.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium text-white/45">
                    {c.sub}
                  </span>
                </span>
              </div>
            ))}

            {/* scroll cue, integrated at the bar's end */}
            <a
              href="#trust"
              aria-label="Scroll to content"
              className="group flex items-center gap-3 py-4 pl-6 text-white/50 transition-colors hover:text-gold"
            >
              <span className="font-display text-[10.5px] font-bold uppercase tracking-[0.25em]">
                Scroll
              </span>
              <span className="relative h-9 w-px overflow-hidden bg-white/20" aria-hidden>
                <motion.span
                  className="absolute left-0 top-0 h-4 w-px bg-gold"
                  animate={reduced ? undefined : { y: [-16, 40] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                />
              </span>
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
