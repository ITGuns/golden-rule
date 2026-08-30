import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CERTIFICATIONS, COMPANY, DIVISIONS } from "@/lib/site";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { ServiceGrid } from "@/components/content/ServiceGrid";
import { Building2, Ear, ShieldCheck, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Commercial HVAC Services — Houston TX",
  description:
    "Commercial AC, heating, refrigeration, kitchen equipment, air balancing & chilled water systems for Houston businesses. Golden Rule Air Conditioning & Heating.",
  alternates: { canonical: "/commercial" },
};

export const revalidate = 300;

const division = DIVISIONS.COMMERCIAL;

const PILLARS = [
  {
    icon: Ear,
    title: "We listen first",
    body: "Correct diagnosis starts with listening — to you and to your equipment — before we recommend a course of action.",
  },
  {
    icon: Building2,
    title: "Full commercial scope",
    body: "Cooling, heating, refrigeration, and kitchen equipment needs and related accessories, handled by one contractor.",
  },
  {
    icon: Wrench,
    title: "Mechanical contractor since 2007",
    body: `A full-service air conditioning and heating mechanical contractor, licensed in Texas (${COMPANY.license}).`,
  },
  {
    icon: ShieldCheck,
    title: "Certified & accountable",
    body: `Industry credentials include ${CERTIFICATIONS.map((c) => c.key).join(", ")}.`,
  },
] as const;

export default async function CommercialPage() {
  const services = await db.service.findMany({
    where: { division: "COMMERCIAL", published: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, excerpt: true, heroImage: true },
  });

  return (
    <>
      <PageHero
        eyebrow="Commercial division"
        title="Keep your business comfortable and open."
        intro={division.blurb}
        image={division.image}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/request-estimate" size="lg">
            Request Estimate
          </ButtonLink>
          <ButtonLink href="/request-service" size="lg" variant="outline-light">
            Request Service
          </ButtonLink>
        </div>
      </PageHero>

      {/* Services grid */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">Commercial capabilities</p>
            <h2 className="display mt-3 max-w-2xl text-3xl sm:text-4xl">
              From rooftop units to walk-in coolers.
            </h2>
          </Reveal>
          <div className="mt-10">
            <ServiceGrid
              services={services}
              basePath="/commercial"
              emptyLabel="No commercial services published yet"
            />
          </div>
        </div>
      </section>

      {/* Why Golden Rule for business */}
      <section className="bg-night py-16 text-white sm:py-20">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">Why businesses call us</p>
            <h2 className="display mt-3 max-w-xl text-3xl !text-white sm:text-4xl">
              Diagnosed correctly. Fixed accountably.
            </h2>
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map((p) => (
              <StaggerItem key={p.title} className="h-full">
                <div className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors duration-300 hover:border-gold/40">
                  <p.icon className="size-6 text-gold" aria-hidden />
                  <p className="font-display font-bold text-white">{p.title}</p>
                  <p className="text-sm leading-relaxed text-white/70">{p.body}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Gentle CTA */}
      <section className="border-b border-line bg-paper py-14">
        <div className="container-site flex flex-wrap items-center justify-between gap-6">
          <Reveal>
            <h2 className="display text-2xl sm:text-3xl">Planning a project or facing a breakdown?</h2>
            <p className="mt-2 max-w-xl text-muted">
              Tell us about your building and equipment — we&rsquo;ll scope it properly.
              {" "}{COMPANY.emergencyNote}.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap items-center gap-4">
            <ButtonLink href="/request-estimate">Request Estimate</ButtonLink>
            <PhoneLink
              label="commercial-cta"
              className="font-display text-lg font-bold text-ink transition-colors hover:text-gold-deep"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
