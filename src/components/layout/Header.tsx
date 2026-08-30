"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ComponentType } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import {
  AirVent,
  ArrowRight,
  Award,
  BadgeDollarSign,
  BookOpen,
  Building2,
  CalendarPlus,
  ChefHat,
  ChevronDown,
  ChevronRight,
  Clock3,
  Fan,
  FileText,
  Flame,
  Gauge,
  Gift,
  HardHat,
  Home,
  Layers,
  Leaf,
  MapPin,
  Menu,
  Newspaper,
  Percent,
  Phone,
  PhoneCall,
  Refrigerator,
  ShieldCheck,
  SlidersHorizontal,
  Snowflake,
  Sparkles,
  Star,
  Thermometer,
  Users,
  Waves,
  Wind,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/site";
import {
  RESIDENTIAL_LINKS,
  COMMERCIAL_LINKS,
  PROGRAM_LINKS,
  COMPANY_LINKS,
  RESOURCE_LINKS,
  AREA_LINKS,
} from "@/lib/nav-data";
import { ButtonLink } from "@/components/ui/Button";
import { PhoneLink } from "./PhoneLink";
import { track } from "@/lib/analytics-client";

type MenuKey = "services" | "areas" | "company" | "resources" | null;
type IconType = ComponentType<{ className?: string }>;

const MENUS: { key: Exclude<MenuKey, null>; label: string; match: (p: string) => boolean }[] = [
  {
    key: "services",
    label: "Services",
    match: (p) =>
      /^\/(residential|commercial|new-construction|maintenance|gold-plated-guarantees|dare-installation-process|referral-program|specials)/.test(p),
  },
  { key: "areas", label: "Service Areas", match: (p) => p.startsWith("/service-areas") },
  {
    key: "company",
    label: "About",
    match: (p) => /^\/(about|careers|contact|reviews)/.test(p),
  },
  {
    key: "resources",
    label: "Resources",
    match: (p) => /^\/(news|how-hvac-works|financing|products)/.test(p),
  },
];

/** Icon accents for mega-menu links, keyed by href. */
const LINK_ICONS: Record<string, IconType> = {
  "/residential/air-conditioning": Snowflake,
  "/residential/air-ducts": AirVent,
  "/residential/duct-sealing": Layers,
  "/residential/ductless-systems": Fan,
  "/residential/furnaces": Flame,
  "/residential/heat-pumps": Thermometer,
  "/residential/indoor-air-quality": Leaf,
  "/residential/maintenance": Wrench,
  "/residential/zone-control-systems": SlidersHorizontal,
  "/residential/energy-efficiency-consultations": Gauge,
  "/commercial/air-balancing": Wind,
  "/commercial/chilled-water-systems": Waves,
  "/commercial/commercial-cooling": Snowflake,
  "/commercial/commercial-heating": Flame,
  "/commercial/kitchen-equipment": ChefHat,
  "/commercial/commercial-maintenance": Wrench,
  "/commercial/commercial-refrigeration": Refrigerator,
  "/new-construction": HardHat,
  "/maintenance": ShieldCheck,
  "/gold-plated-guarantees": Award,
  "/dare-installation-process": Sparkles,
  "/referral-program": Gift,
  "/specials": Percent,
  "/about": Home,
  "/about#why": Star,
  "/careers": Users,
  "/reviews": Star,
  "/contact": Phone,
  "/news": Newspaper,
  "/how-hvac-works": BookOpen,
  "/financing": BadgeDollarSign,
  "/products": Layers,
};

export function Header() {
  const pathname = usePathname();
  const reduced = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  const isHome = pathname === "/";
  // dark glass pill over the home hero; light glass everywhere else / after scroll
  const overlay = isHome && !scrolled;
  const darkPill = overlay || mobileOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        setMobileOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const enter = (key: Exclude<MenuKey, null>) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(key);
  };
  const leave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 140);
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-[80]">
      <a
        href="#main"
        className="sr-only pointer-events-auto focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-gold focus:px-4 focus:py-2 focus:font-bold focus:text-ink"
      >
        Skip to content
      </a>

      {/* scroll progress hairline along the very top of the viewport */}
      {scrolled && (
        <motion.div
          className="absolute inset-x-0 top-0 z-30 h-[2.5px] origin-left bg-gradient-to-r from-gold via-gold to-gold-deep"
          style={{ scaleX: reduced ? 1 : progress }}
          aria-hidden
        />
      )}

      {/* page dim below an open mega menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto fixed inset-0 z-0 hidden bg-ink/30 backdrop-blur-[2px] xl:block"
            onClick={() => setOpen(null)}
            aria-hidden
          />
        )}
      </AnimatePresence>

      {/* mobile drawer — full screen beneath the floating pill */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto fixed inset-0 z-[5] overflow-y-auto bg-night pt-[96px] xl:hidden"
          >
            <motion.nav
              aria-label="Mobile"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="container-site flex flex-col pb-32"
            >
              {/* quick actions */}
              <div className="mb-5 grid grid-cols-2 gap-3">
                <Link
                  href="/request-service"
                  onClick={() => track("cta_click", { cta: "mobile-menu-request" })}
                  className="flex flex-col gap-2 rounded-3xl border-2 border-ink bg-gold p-4 text-ink shadow-gold"
                >
                  <CalendarPlus className="size-6" aria-hidden />
                  <span className="font-display text-sm font-bold leading-tight">
                    Request
                    <br />
                    Service
                  </span>
                </Link>
                <a
                  href={COMPANY.phoneHref}
                  onClick={() => track("phone_click", { label: "mobile-menu-card" })}
                  className="flex flex-col gap-2 rounded-3xl border border-white/15 bg-white/5 p-4 text-white"
                >
                  <PhoneCall className="size-6 text-gold" aria-hidden />
                  <span className="font-display text-sm font-bold leading-tight">
                    281-500-RUSH
                    <br />
                    <span className="text-[11px] font-medium text-white/55">24/7 Emergency</span>
                  </span>
                </a>
              </div>

              <MobileGroup title="Residential" icon={Home} links={RESIDENTIAL_LINKS} seeAll="/residential" />
              <MobileGroup title="Commercial" icon={Building2} links={COMMERCIAL_LINKS} seeAll="/commercial" />
              <MobileGroup
                title="New Construction"
                icon={HardHat}
                links={[{ name: "Construction Projects", href: "/new-construction" }]}
              />
              <MobileGroup title="Programs" icon={Award} links={PROGRAM_LINKS} />
              <MobileGroup title="Service Areas" icon={MapPin} links={AREA_LINKS} seeAll="/service-areas" />
              <MobileGroup title="Company" icon={Users} links={COMPANY_LINKS} />
              <MobileGroup title="Resources" icon={BookOpen} links={RESOURCE_LINKS} />

              <div className="mt-6 flex flex-col gap-3">
                <ButtonLink href="/request-estimate" variant="outline-light" size="lg" className="w-full !rounded-full">
                  Request Estimate
                </ButtonLink>
                <Link
                  href="/financing"
                  className="py-2 text-center text-sm font-semibold text-white/70 hover:text-gold"
                >
                  Explore Financing
                </Link>
              </div>

              <p className="mt-8 flex items-center justify-center gap-4 text-center text-[11px] text-white/40">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5 text-gold" aria-hidden />
                  License {COMPANY.license}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock3 className="size-3.5 text-gold" aria-hidden />
                  Emergency service available
                </span>
              </p>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container-site pt-3">
        <div className="relative">
          {/* ——— the floating pill ——— */}
          <div
            className={cn(
              "pointer-events-auto relative z-20 flex items-center justify-between gap-3 rounded-full border pl-3 pr-2.5 transition-all duration-300 sm:pl-4 sm:pr-3",
              darkPill
                ? "border-white/15 bg-night/60 shadow-[0_10px_40px_rgb(0_0_0/0.4)] backdrop-blur-xl"
                : "border-line/80 bg-white/85 shadow-[0_10px_35px_-8px_rgb(0_0_0/0.18)] backdrop-blur-xl backdrop-saturate-150",
              scrolled ? "h-14" : "h-16"
            )}
          >
            <Link
              href="/"
              aria-label="Golden Rule Air Conditioning & Heating — home"
              className={cn(
                "shrink-0 transition-all",
                darkPill && "rounded-full bg-white/95 px-3 py-1 shadow-[0_2px_12px_rgb(0_0_0/0.25)]"
              )}
            >
              <Image
                src="/brand/GOL_Logo-RGB-2.png"
                alt="Golden Rule Air Conditioning & Heating"
                width={196}
                height={65}
                priority
                className={cn("w-auto transition-all duration-300", scrolled ? "h-8" : "h-9")}
              />
            </Link>

            {/* desktop nav */}
            <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
              {MENUS.map((m) => {
                const active = m.match(pathname);
                return (
                  <div key={m.key} onMouseEnter={() => enter(m.key)} onMouseLeave={leave} className="relative">
                    <button
                      aria-expanded={open === m.key}
                      aria-haspopup="true"
                      onClick={() => setOpen(open === m.key ? null : m.key)}
                      className={cn(
                        "relative flex items-center gap-1 rounded-full px-3 py-2 text-[15px] font-semibold transition-colors",
                        darkPill ? "text-white/90 hover:text-white" : "text-ink hover:bg-black/5"
                      )}
                    >
                      {m.label}
                      <ChevronDown
                        className={cn(
                          "size-3.5 transition-transform duration-200",
                          open === m.key && "rotate-180",
                          darkPill ? "text-gold" : "text-gold-deep"
                        )}
                        aria-hidden
                      />
                      {(active || open === m.key) && (
                        <motion.span
                          layoutId="nav-underline"
                          transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="absolute inset-x-3 bottom-0.5 h-0.5 rounded-full bg-gold"
                          aria-hidden
                        />
                      )}
                    </button>
                  </div>
                );
              })}
              <Link
                href="/financing"
                className={cn(
                  "relative rounded-full px-3 py-2 text-[15px] font-semibold transition-colors",
                  darkPill ? "text-white/85 hover:text-white" : "text-ink hover:bg-black/5",
                  pathname === "/financing" &&
                    "after:absolute after:inset-x-3 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-gold"
                )}
              >
                Financing
              </Link>
            </nav>

            {/* right cluster */}
            <div className="hidden items-center gap-2 xl:flex">
              <PhoneLink
                label="header"
                showIcon={false}
                className={cn(
                  "group mr-1 flex-col items-end gap-0 leading-tight",
                  darkPill ? "text-white" : "text-ink"
                )}
              >
                <span className="flex items-center gap-1.5 font-display text-[14.5px] font-bold tracking-wide transition-colors group-hover:text-gold-deep">
                  <span
                    className={cn(
                      "grid size-6 place-items-center rounded-full transition-transform group-hover:scale-110",
                      darkPill ? "bg-gold text-ink" : "bg-gold-soft text-gold-deep"
                    )}
                  >
                    <PhoneCall className="size-3" aria-hidden />
                  </span>
                  281-500-RUSH
                </span>
                <span className={cn("text-[10.5px] font-medium", darkPill ? "text-white/60" : "text-muted")}>
                  24/7 Emergency Service
                </span>
              </PhoneLink>
              <ButtonLink
                href="/request-estimate"
                variant={darkPill ? "outline-light" : "outline"}
                size="sm"
                className="!rounded-full"
                onClick={() => track("cta_click", { cta: "nav-estimate" })}
              >
                Request Estimate
              </ButtonLink>
              <ButtonLink
                href="/request-service"
                size="sm"
                className="!rounded-full"
                onClick={() => track("cta_click", { cta: "nav-request-service" })}
              >
                Request Service
              </ButtonLink>
            </div>

            {/* mobile trigger */}
            <button
              className={cn(
                "rounded-full p-2.5 xl:hidden",
                darkPill ? "text-white" : "text-ink hover:bg-black/5"
              )}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </button>
          </div>

          {/* ——— floating mega menu panel ——— */}
          <AnimatePresence>
            {open && (
              <motion.div
                key={open}
                initial={{ opacity: 0, y: -10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                onMouseEnter={() => enter(open)}
                onMouseLeave={leave}
                className="pointer-events-auto absolute inset-x-0 top-full z-10 mt-2.5 hidden overflow-hidden rounded-[28px] border border-line bg-white shadow-[0_40px_80px_-24px_rgb(0_0_0/0.35)] xl:block"
              >
                <div className="p-8">
                  {open === "services" && (
                    <div className="grid grid-cols-[1fr_1fr_1fr_300px] gap-9">
                      <MenuColumn title="Residential" links={RESIDENTIAL_LINKS.slice(0, 8)} seeAll="/residential" seeAllLabel="All residential services" />
                      <MenuColumn title="Commercial" links={COMMERCIAL_LINKS} seeAll="/commercial" seeAllLabel="All commercial services" />
                      <div className="space-y-7">
                        <MenuColumn
                          title="New Construction"
                          links={[{ name: "Construction Projects", href: "/new-construction" }]}
                        />
                        <MenuColumn title="Programs" links={PROGRAM_LINKS.slice(0, 4)} />
                      </div>
                      <FeaturedCard
                        href="/maintenance"
                        image="/images/maintenance_1024x576.jpg"
                        eyebrow="GoldStandard™"
                        title="Protect your comfort with planned maintenance"
                        cta="Explore maintenance"
                      />
                    </div>
                  )}
                  {open === "areas" && (
                    <div className="grid grid-cols-[1fr_1.2fr_300px] gap-9">
                      <div>
                        <p className="eyebrow mb-3">Serving Greater Houston</p>
                        <p className="text-sm leading-relaxed text-muted">
                          Residential, commercial, and new construction HVAC across the Houston metro
                          since {COMPANY.founded} — based at {COMPANY.address.street}, {COMPANY.address.city}.
                        </p>
                        <Link
                          href="/service-areas"
                          className="mt-4 inline-flex items-center gap-1.5 font-display text-sm font-bold text-gold-deep hover:underline"
                        >
                          View the full service area <ArrowRight className="size-4" aria-hidden />
                        </Link>
                      </div>
                      <div>
                        <p className="eyebrow mb-3">Cities</p>
                        <ul className="grid grid-cols-2 gap-1">
                          {AREA_LINKS.map((l) => (
                            <li key={l.href}>
                              <MenuLink href={l.href} name={l.name} icon={MapPin} />
                            </li>
                          ))}
                        </ul>
                      </div>
                      <FeaturedCard
                        href="/request-service"
                        image="/images/GOL-Homepage-Banner.jpg"
                        eyebrow="Ready when you are"
                        title="Request service online in about two minutes"
                        cta="Request service"
                      />
                    </div>
                  )}
                  {open === "company" && (
                    <div className="grid grid-cols-[1fr_1.3fr_300px] gap-9">
                      <MenuColumn title="Company" links={COMPANY_LINKS} />
                      <div className="rounded-2xl border border-gold/40 bg-gold-soft/60 p-6">
                        <p className="eyebrow mb-2">The Golden Rule</p>
                        <p className="text-sm italic leading-relaxed text-body">{COMPANY.guidingVerse}</p>
                        <p className="mt-3 text-xs text-muted">
                          Our guiding principle with suppliers, fellow contractors, employees, and customers.
                        </p>
                      </div>
                      <FeaturedCard
                        href="/careers"
                        image="/images/27331977_1935965523178376_3166800883104034615_n.jpg"
                        eyebrow="We're hiring"
                        title="Join a team built on integrity"
                        cta="See careers"
                      />
                    </div>
                  )}
                  {open === "resources" && (
                    <div className="grid grid-cols-[1fr_1fr_300px] gap-9">
                      <MenuColumn title="Resources" links={RESOURCE_LINKS} />
                      <MenuColumn
                        title="Popular reading"
                        links={[
                          { name: "Why Is My AC Blowing Hot Air?", href: "/news/why-is-my-ac-blowing-hot-air" },
                          { name: "What Does AC SEER Mean?", href: "/news/what-does-ac-seer-mean" },
                          { name: "AC Maintenance Checklist", href: "/news/ac-maintenance-checklist" },
                        ]}
                        icon={FileText}
                      />
                      <FeaturedCard
                        href="/how-hvac-works"
                        image="/images/AC_A_029-How-Your-AC-Cools-Your-Home-2-e1628799548613.jpg"
                        eyebrow="Interactive"
                        title="See inside your comfort system in 3D"
                        cta="How HVAC works"
                      />
                    </div>
                  )}
                </div>

                {/* menu footer strip */}
                <div className="border-t border-line bg-paper">
                  <div className="flex items-center justify-between gap-4 px-8 py-3.5">
                    <PhoneLink
                      label="mega-menu"
                      className="font-display text-sm font-bold text-ink hover:text-gold-deep"
                    >
                      {COMPANY.phoneVanity} — 24/7 Emergency Service
                    </PhoneLink>
                    <div className="flex items-center gap-3">
                      <ButtonLink href="/request-estimate" variant="outline" size="sm" className="!rounded-full">
                        Request Estimate
                      </ButtonLink>
                      <ButtonLink href="/request-service" size="sm" className="!rounded-full">
                        Request Service
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function MenuLink({
  href,
  name,
  icon,
}: {
  href: string;
  name: string;
  icon?: IconType;
}) {
  const Icon = icon || LINK_ICONS[href];
  return (
    <Link
      href={href}
      className="group/link flex items-center gap-2.5 rounded-lg px-2 py-[7px] text-[14.5px] font-medium text-body transition-colors hover:bg-gold-soft hover:text-ink"
    >
      {Icon && (
        <Icon
          className="size-4 shrink-0 text-muted transition-colors group-hover/link:text-gold-deep"
          aria-hidden
        />
      )}
      <span className="flex-1">{name}</span>
      <ChevronRight
        className="size-3.5 -translate-x-1 text-gold-deep opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100"
        aria-hidden
      />
    </Link>
  );
}

function MenuColumn({
  title,
  links,
  seeAll,
  seeAllLabel,
  icon,
}: {
  title: string;
  links: { name: string; href: string }[];
  seeAll?: string;
  seeAllLabel?: string;
  icon?: IconType;
}) {
  return (
    <div>
      <p className="eyebrow mb-3">{title}</p>
      <ul className="space-y-0.5">
        {links.map((l) => (
          <li key={l.href}>
            <MenuLink href={l.href} name={l.name} icon={icon} />
          </li>
        ))}
        {seeAll && (
          <li>
            <Link
              href={seeAll}
              className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1.5 font-display text-[13px] font-bold text-gold-deep hover:underline"
            >
              {seeAllLabel || "View all"} <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

function FeaturedCard({
  href,
  image,
  eyebrow,
  title,
  cta,
}: {
  href: string;
  image: string;
  eyebrow: string;
  title: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group/feat relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-2xl border border-line"
    >
      <Image
        src={image}
        alt=""
        fill
        sizes="300px"
        className="object-cover transition-transform duration-500 group-hover/feat:scale-[1.05]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-night via-night/55 to-night/10" />
      <div className="relative p-5">
        <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
          {eyebrow}
        </p>
        <p className="mt-1.5 font-display text-[17px] font-bold leading-snug text-white">{title}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 font-display text-[13px] font-bold text-gold">
          {cta}
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover/feat:translate-x-1"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}

function MobileGroup({
  title,
  links,
  seeAll,
  icon: Icon,
}: {
  title: string;
  links: { name: string; href: string }[];
  seeAll?: string;
  icon?: IconType;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between py-4 text-left font-display text-lg font-semibold text-white"
      >
        <span className="flex items-center gap-3">
          {Icon && (
            <span className="grid size-8 place-items-center rounded-lg bg-white/5">
              <Icon className="size-4 text-gold" aria-hidden />
            </span>
          )}
          {title}
        </span>
        <ChevronDown
          className={cn("size-5 text-gold transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden pb-2"
          >
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="flex items-center gap-2 py-2 pl-11 text-[15px] text-white/80 hover:text-gold"
                >
                  {l.name}
                </Link>
              </li>
            ))}
            {seeAll && (
              <li>
                <Link
                  href={seeAll}
                  className="flex items-center gap-1.5 py-2 pl-11 font-display text-sm font-bold text-gold"
                >
                  View all <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
