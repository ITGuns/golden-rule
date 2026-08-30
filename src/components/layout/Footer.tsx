import Link from "next/link";
import Image from "next/image";
import { COMPANY, SOCIALS, CERTIFICATIONS } from "@/lib/site";
import {
  RESIDENTIAL_LINKS,
  COMMERCIAL_LINKS,
  PROGRAM_LINKS,
  RESOURCE_LINKS,
  AREA_LINKS,
} from "@/lib/nav-data";
import { PhoneLink } from "./PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";

/** Brand glyphs (lucide dropped brand icons) — minimal inline SVG paths. */
function SocialGlyph({ name, className }: { name: string; className?: string }) {
  const paths: Record<string, string> = {
    Facebook:
      "M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.3 0-1.1-.1-2.1-.1-2.1 0-3.6 1.3-3.6 3.7V11H8v3h2.7v7h2.8z",
    Instagram:
      "M12 8.4A3.6 3.6 0 1 0 12 15.6 3.6 3.6 0 0 0 12 8.4zm0 5.9a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6zM17 7.9a.9.9 0 1 1-1.8 0 .9.9 0 0 1 1.8 0zM12 5.5c-1.8 0-2 0-2.7.1-.7 0-1.2.1-1.6.3-.4.2-.8.4-1.1.7-.3.3-.6.7-.7 1.1-.2.4-.3.9-.3 1.6C5.5 10 5.5 10.2 5.5 12s0 2 .1 2.7c0 .7.1 1.2.3 1.6.2.4.4.8.7 1.1.3.3.7.6 1.1.7.4.2.9.3 1.6.3.7.1.9.1 2.7.1s2 0 2.7-.1c.7 0 1.2-.1 1.6-.3.4-.2.8-.4 1.1-.7.3-.3.6-.7.7-1.1.2-.4.3-.9.3-1.6.1-.7.1-.9.1-2.7s0-2-.1-2.7c0-.7-.1-1.2-.3-1.6a3 3 0 0 0-.7-1.1 3 3 0 0 0-1.1-.7c-.4-.2-.9-.3-1.6-.3-.7-.1-.9-.1-2.7-.1zm0 1.2c1.7 0 1.9 0 2.6.1.6 0 1 .1 1.2.2.3.1.5.3.7.5.2.2.4.4.5.7.1.2.2.6.2 1.2 0 .7.1.9.1 2.6s0 1.9-.1 2.6c0 .6-.1 1-.2 1.2-.1.3-.3.5-.5.7a2 2 0 0 1-.7.5c-.2.1-.6.2-1.2.2-.7 0-.9.1-2.6.1s-1.9 0-2.6-.1c-.6 0-1-.1-1.2-.2a2 2 0 0 1-.7-.5 2 2 0 0 1-.5-.7c-.1-.2-.2-.6-.2-1.2 0-.7-.1-.9-.1-2.6s0-1.9.1-2.6c0-.6.1-1 .2-1.2.1-.3.3-.5.5-.7.2-.2.4-.4.7-.5.2-.1.6-.2 1.2-.2.7-.1.9-.1 2.6-.1z",
    LinkedIn:
      "M6.5 8.8a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM5.1 18.4h2.8v-8.3H5.1v8.3zm5-8.3v8.3h2.8v-4.1c0-1.2.4-2 1.5-2 1 0 1.4.7 1.4 2v4.1h2.8v-4.7c0-2.5-1.3-3.8-3.1-3.8-1.4 0-2.1.8-2.5 1.4h-.1v-1.2h-2.8z",
    X: "M13.9 10.5 19.3 4.5h-1.6l-4.5 5.1-3.6-5.1H5.2l5.7 8.1-5.7 6.4h1.6l4.9-5.5 3.9 5.5h4.4l-6.1-8.5zm-1.7 2-.6-.8-4.5-6.2h2l3.7 5.1.6.8 4.7 6.6h-2l-3.9-5.5z",
  };
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d={paths[name] || paths.Facebook} />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-night text-white/80">
      {/* hairline gold gradient along the footer's very top */}
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
        aria-hidden
      />

      {/* CTA band */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-night via-night-soft to-night">
        {/* dark-section layers: blueprint grid + corner glows + film grain */}
        <div className="bg-blueprint absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -left-28 -top-36 size-96 rounded-full bg-gold/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-44 -right-24 h-80 w-[26rem] rounded-full bg-sky-500/[0.07] blur-3xl"
          aria-hidden
        />
        <div className="noise-overlay" aria-hidden />

        <div className="container-site relative z-10 flex flex-col items-center gap-7 py-16 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <p className="eyebrow !text-gold">24/7 Emergency Service</p>
            <h2 className="display mt-3 text-2xl !text-white sm:text-3xl">Need HVAC service?</h2>
            <p className="mt-1.5 text-white/60">
              Contact the experts at Golden Rule Air Conditioning &amp; Heating.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <PhoneLink
              label="footer"
              className="group rounded-full border-2 border-white/25 bg-white/5 px-7 py-3 font-display text-lg font-bold text-white backdrop-blur-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-gold hover:text-gold"
            >
              281-500-RUSH
            </PhoneLink>
            <ButtonLink href="/request-service" size="lg" className="group !rounded-full shadow-gold">
              Request Service
              <ArrowRight
                className="size-4.5 transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              />
            </ButtonLink>
          </div>
        </div>
      </div>

      {/* link columns */}
      <div className="container-site grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2 lg:col-span-1">
          <span className="inline-block rounded-xl bg-white/95 px-3 py-2">
            <Image
              src="/brand/GOL_Logo-RGB-2.png"
              alt="Golden Rule Air Conditioning & Heating"
              width={180}
              height={59}
              className="h-11 w-auto"
            />
          </span>
          <p className="mt-4 text-sm leading-relaxed text-white/55">
            Full-service air conditioning and heating mechanical contractor serving Greater Houston
            since {COMPANY.founded}. Residential, Commercial, and New Construction.
          </p>
          <p className="mt-4 flex items-start gap-2 text-sm text-white/55">
            <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <span>
              {COMPANY.address.street}
              <br />
              {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.zip}
            </span>
          </p>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/55">
            <ShieldCheck className="size-4 shrink-0 text-gold" aria-hidden />
            Texas License {COMPANY.license}
          </p>
          <div className="mt-5 flex gap-2">
            {SOCIALS.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Golden Rule on ${s.name}`}
                className="grid size-9 place-items-center rounded-full border border-white/15 text-white/70 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-gold hover:text-gold"
              >
                <SocialGlyph name={s.name} className="size-4" />
              </a>
            ))}
          </div>
        </div>

        <FooterCol
          title="Residential"
          links={[...RESIDENTIAL_LINKS.slice(0, 8), { name: "View all residential", href: "/residential" }]}
        />
        <FooterCol
          title="Commercial"
          links={[
            ...COMMERCIAL_LINKS,
            { name: "New Construction", href: "/new-construction" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { name: "About Us", href: "/about" },
            { name: "Careers", href: "/careers" },
            { name: "Knowledge Center", href: "/news" },
            { name: "Service Areas", href: "/service-areas" },
            { name: "Reviews", href: "/reviews" },
            { name: "Contact", href: "/contact" },
            ...AREA_LINKS.slice(0, 3),
          ]}
        />
        <FooterCol
          title="Resources"
          links={[
            ...PROGRAM_LINKS,
            ...RESOURCE_LINKS.filter((l) => l.href !== "/news"),
            { name: "Request Estimate", href: "/request-estimate" },
          ]}
        />
      </div>

      {/* associations */}
      <div className="border-t border-white/10">
        <div className="container-site flex flex-wrap items-center justify-center gap-x-8 gap-y-5 py-9">
          <span className="eyebrow !text-white/40">Certifications &amp; Memberships</span>
          {CERTIFICATIONS.map((c) =>
            c.image ? (
              <span
                key={c.key}
                className="inline-flex items-center rounded-xl bg-white/95 px-3 py-2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:shadow-lift"
              >
                <Image
                  src={c.image}
                  alt={c.label}
                  width={90}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
              </span>
            ) : (
              <span key={c.key} className="font-display text-sm font-bold tracking-wider text-white/70">
                {c.key}
              </span>
            )
          )}
        </div>
      </div>

      {/* legal */}
      <div className="border-t border-white/10">
        <div className="container-site flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/45 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {COMPANY.legalFooter} · Texas License {COMPANY.license}
          </p>
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link href="/privacy-policy" className="transition-colors hover:text-gold">
              Privacy Policy
            </Link>
            <Link href="/terms" className="transition-colors hover:text-gold">
              Terms
            </Link>
            <Link href="/accessibility" className="transition-colors hover:text-gold">
              Accessibility
            </Link>
            <Link href="/site-map" className="transition-colors hover:text-gold">
              Sitemap
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { name: string; href: string }[] }) {
  return (
    <nav aria-label={title}>
      <p className="eyebrow mb-4 !text-gold">{title}</p>
      <ul className="space-y-[7px]">
        {links.map((l) => (
          <li key={l.href + l.name}>
            <Link
              href={l.href}
              className="group/fl relative inline-block text-[13.5px] leading-snug text-white/60 transition-colors duration-300 hover:text-white"
            >
              {l.name}
              <span
                className="absolute inset-x-0 -bottom-0.5 h-[2px] origin-left scale-x-0 rounded-full bg-gold transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/fl:scale-x-100"
                aria-hidden
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
