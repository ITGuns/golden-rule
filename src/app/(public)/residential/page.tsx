import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { DIVISIONS, GUARANTEES } from "@/lib/site";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { ServiceGrid } from "@/components/content/ServiceGrid";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Residential HVAC Services — Houston TX",
  description:
    "Residential AC, heating, ductwork, indoor air quality & maintenance for Houston-area homes. All major brands. Golden Rule Air Conditioning & Heating, since 2007.",
  alternates: { canonical: "/residential" },
};

export const revalidate = 300;

const division = DIVISIONS.RESIDENTIAL;

export default async function ResidentialPage() {
  const services = await db.service.findMany({
    where: { division: "RESIDENTIAL", published: true },
    orderBy: { sortOrder: "asc" },
    select: { slug: true, name: true, excerpt: true, heroImage: true },
  });

  return (
    <>
      <PageHero
        eyebrow="Residential division"
        title="Comfort for your home, done the right way."
        intro={division.blurb}
        image={division.image}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/request-service" size="lg">
            Request Service
          </ButtonLink>
          <ButtonLink href="/request-estimate" size="lg" variant="outline-light">
            Request Estimate
          </ButtonLink>
        </div>
      </PageHero>

      {/* Services grid */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">What we do at home</p>
            <h2 className="display mt-3 max-w-2xl text-3xl sm:text-4xl">
              Every residential service, one standard of care.
            </h2>
          </Reveal>
          <div className="mt-10">
            <ServiceGrid
              services={services}
              basePath="/residential"
              emptyLabel="No residential services published yet"
            />
          </div>
        </div>
      </section>

      {/* Guarantees teaser */}
      <section className="bg-night py-16 text-white sm:py-20">
        <div className="container-site">
          <Reveal className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="eyebrow">Backed in writing</p>
              <h2 className="display mt-3 max-w-xl text-3xl !text-white sm:text-4xl">
                5 Gold Plated Guarantees on every install.
              </h2>
            </div>
            <ButtonLink href="/gold-plated-guarantees" variant="outline-light">
              Read the guarantees
              <ArrowRight className="size-4" aria-hidden />
            </ButtonLink>
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {GUARANTEES.map((g) => (
              <StaggerItem key={g.title} className="h-full">
                <div className="flex h-full flex-col items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors duration-300 hover:border-gold/40">
                  <Image src={g.icon} alt="" width={44} height={44} className="h-11 w-11 object-contain" />
                  <p className="font-display text-sm font-bold leading-snug text-white">
                    {g.title}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Gentle CTA (footer already carries the main CTA band) */}
      <section className="border-b border-line bg-paper py-14">
        <div className="container-site flex flex-wrap items-center justify-between gap-6">
          <Reveal>
            <h2 className="display text-2xl sm:text-3xl">Not sure which service you need?</h2>
            <p className="mt-2 max-w-xl text-muted">
              Describe the problem and we&rsquo;ll take it from there — or talk it through
              with a real person.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap items-center gap-4">
            <ButtonLink href="/request-service">Request Service</ButtonLink>
            <PhoneLink
              label="residential-cta"
              className="font-display text-lg font-bold text-ink transition-colors hover:text-gold-deep"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
