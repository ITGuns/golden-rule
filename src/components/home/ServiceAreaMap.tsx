"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ExternalLink, MapPin, Search } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { Input } from "@/components/ui/Field";
import { COMPANY } from "@/lib/site";
import Link from "next/link";

/** Verified Greater-Houston service area with a live Google Map of the HQ. */
const CITIES = [
  { slug: "houston-tx", name: "Houston" },
  { slug: "cypress-tx", name: "Cypress" },
  { slug: "spring-tx", name: "Spring" },
  { slug: "tomball-tx", name: "Tomball" },
  { slug: "katy-tx", name: "Katy" },
  { slug: "sugar-land-tx", name: "Sugar Land" },
];

const HQ_QUERY = `${COMPANY.name}, ${COMPANY.address.street}, ${COMPANY.address.city}, ${COMPANY.address.state} ${COMPANY.address.zip}`;

export function ServiceAreaMap() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const match = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    return CITIES.find((c) => c.name.toLowerCase().includes(q)) || null;
  }, [query]);

  return (
    <section className="bg-white py-24">
      <div className="container-site grid items-center gap-12 lg:grid-cols-2">
        <Reveal direction="right">
          <p className="eyebrow">Service Area</p>
          <h2 className="display mt-4 text-4xl sm:text-5xl">Greater Houston, covered.</h2>
          <p className="mt-4 max-w-md leading-relaxed text-muted">
            Based at {COMPANY.address.street} in {COMPANY.address.city}, our teams serve homes,
            businesses, and construction sites across the metro.
          </p>

          <form
            className="relative mt-7 max-w-sm"
            onSubmit={(e) => {
              e.preventDefault();
              if (match) router.push(`/service-areas/${match.slug}`);
            }}
            role="search"
          >
            <Search
              className="pointer-events-none absolute left-3.5 top-[22px] size-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your city…"
              aria-label="Search service area by city"
              className="pl-10"
            />
            {query.length >= 2 && (
              <div className="mt-3 text-sm" aria-live="polite">
                {match ? (
                  <Link
                    href={`/service-areas/${match.slug}`}
                    className="group inline-flex items-center gap-2.5 rounded-xl border border-gold/40 bg-gold-soft/60 py-1.5 pl-2 pr-4 font-semibold text-ink shadow-sm transition-all duration-300 hover:border-gold hover:shadow-gold"
                  >
                    <span
                      className="grid size-5 shrink-0 place-items-center rounded-full bg-gold text-ink"
                      aria-hidden
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    We serve {match.name}, TX — view local services
                    <ArrowRight
                      className="size-3.5 shrink-0 text-gold-deep transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden
                    />
                  </Link>
                ) : (
                  <span className="text-muted">
                    Not listed?{" "}
                    <Link href="/contact" className="font-semibold text-gold-deep underline">
                      Contact us
                    </Link>{" "}
                    — we may still be able to help.
                  </span>
                )}
              </div>
            )}
          </form>

          <ul className="mt-7 flex max-w-md flex-wrap gap-2">
            {CITIES.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/service-areas/${c.slug}`}
                  className="group flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-body transition-all duration-300 hover:-translate-y-0.5 hover:border-gold hover:bg-gold-soft hover:text-ink hover:shadow-lift"
                >
                  <MapPin
                    className="size-4 text-muted transition-colors duration-300 group-hover:text-gold-deep"
                    aria-hidden
                  />
                  {c.name}, TX
                </Link>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal direction="left">
          <div className="overflow-hidden rounded-3xl border border-line shadow-lift">
            <iframe
              src={`https://www.google.com/maps?q=${encodeURIComponent(HQ_QUERY)}&z=10&output=embed`}
              title="Golden Rule Air Conditioning & Heating — Greater Houston service area map"
              className="h-[420px] w-full sm:h-[480px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-white px-5 py-3.5">
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <MapPin className="size-4 shrink-0 text-gold-deep" aria-hidden />
                {COMPANY.address.street}, {COMPANY.address.city}, {COMPANY.address.state}{" "}
                {COMPANY.address.zip}
              </p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(HQ_QUERY)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-gold-deep hover:underline"
              >
                Get directions
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
