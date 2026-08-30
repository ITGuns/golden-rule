import type { Metadata } from "next";
import Image from "next/image";
import { BRANDS, DIVISIONS } from "@/lib/site";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Products & Brands — Houston TX",
  description:
    "The HVAC equipment brands we install and service in Greater Houston — American Standard, Bryant, Daikin, Lennox, Mitsubishi Electric, Ruud, Trane, and York.",
  alternates: { canonical: "/products" },
};

export default function ProductsPage() {
  return (
    <>
      <PageHero
        eyebrow="Products & brands"
        title="The right equipment, matched to your home."
        intro={DIVISIONS.RESIDENTIAL.blurb}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/request-estimate" size="lg">
            Request Estimate
          </ButtonLink>
          <PhoneLink
            label="products-hero"
            className="font-display text-lg font-bold text-ink transition-colors hover:text-gold-deep"
          />
        </div>
      </PageHero>

      {/* Brand grid */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">Equipment we install</p>
            <h2 className="display mt-3 max-w-2xl text-3xl sm:text-4xl">
              Major brands, honest recommendations.
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              Access to all major brands means the recommendation is about your home
              and budget — not a quota.
            </p>
          </Reveal>
          <StaggerGroup className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {BRANDS.map((brand) => (
              <StaggerItem key={brand.name} className="h-full">
                <div className="group flex h-full flex-col items-center gap-4 rounded-3xl border border-line bg-white p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-lift">
                  <div className="relative h-20 w-full">
                    <Image
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-contain transition-transform duration-300 group-hover:scale-[1.06]"
                    />
                  </div>
                  <p className="font-display text-sm font-bold text-ink transition-colors group-hover:text-gold-deep">
                    {brand.name}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* We service all brands */}
      <section className="bg-night py-16 text-white sm:py-20">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">Already own a system?</p>
            <h2 className="display mt-3 text-3xl !text-white sm:text-4xl">
              We service all brands.
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-white/70">
              Whatever nameplate is on your equipment, our technicians will diagnose it
              and recommend the best course of action — repair or replace, explained
              plainly.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <ButtonLink href="/request-service">
                <Wrench className="size-4" aria-hidden />
                Request Service
              </ButtonLink>
              <PhoneLink
                label="products-all-brands"
                className="font-display text-lg font-bold text-white transition-colors hover:text-gold"
              />
            </div>
          </Reveal>
          <Reveal direction="left">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white p-6 shadow-lift">
              <Image
                src="/images/hvac-brands-horizontal.png"
                alt="Logos of the HVAC equipment brands we service"
                width={1024}
                height={341}
                className="h-auto w-full object-contain"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Estimate CTA */}
      <section className="border-b border-line bg-paper py-14">
        <div className="container-site flex flex-wrap items-center justify-between gap-6">
          <Reveal>
            <h2 className="display text-2xl sm:text-3xl">Comparing systems?</h2>
            <p className="mt-2 max-w-xl text-muted">
              Get a straight answer on which equipment fits your home, your budget, and
              Houston&rsquo;s climate.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <ButtonLink href="/request-estimate">Request Estimate</ButtonLink>
          </Reveal>
        </div>
      </section>
    </>
  );
}
