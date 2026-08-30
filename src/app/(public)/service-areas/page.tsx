import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { COMPANY, SERVICE_CITIES } from "@/lib/site";
import { MapEmbed } from "@/components/layout/Embeds";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { ArrowRight, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Service Areas — Greater Houston TX",
  description:
    "Golden Rule Air Conditioning & Heating serves Houston, Cypress, Spring, Tomball, Katy, and Sugar Land from our Houston headquarters. Find your city.",
  alternates: { canonical: "/service-areas" },
};

export const revalidate = 300;

/** First readable line of an area body, for the card teaser. */
function teaserFrom(body: string) {
  const line = body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && !/^[-*+]\s/.test(l));
  return line ?? "";
}

export default async function ServiceAreasPage() {
  const areas = await db.serviceArea.findMany({
    where: { published: true },
    select: { slug: true, city: true, state: true, body: true },
  });

  // Present in the verified SERVICE_CITIES order; append any extra published areas.
  type Area = (typeof areas)[number];
  const bySlug = new Map<string, Area>(areas.map((a) => [a.slug, a] as [string, Area]));
  const ordered = [
    ...SERVICE_CITIES.map((c) => bySlug.get(c.slug)).filter((a): a is Area => Boolean(a)),
    ...areas.filter((a) => !SERVICE_CITIES.some((c) => c.slug === a.slug)),
  ];

  return (
    <>
      <PageHero
        eyebrow="Service areas"
        title="Rooted in Houston, serving the neighbors."
        intro={`From our headquarters at ${COMPANY.address.street}, ${COMPANY.address.city}, ${COMPANY.address.state} ${COMPANY.address.zip}, we serve homes and businesses across Greater Houston. ${COMPANY.emergencyNote}.`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/request-service" size="lg">
            Request Service
          </ButtonLink>
          <PhoneLink
            label="service-areas-hero"
            className="font-display text-lg font-bold text-ink transition-colors hover:text-gold-deep"
          />
        </div>
      </PageHero>

      {/* City cards */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">Where we work</p>
            <h2 className="display mt-3 max-w-2xl text-3xl sm:text-4xl">
              Find your city.
            </h2>
          </Reveal>
          {ordered.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-line bg-paper p-12 text-center">
              <p className="font-display text-lg font-bold text-ink">
                Area pages are being published
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                We serve {SERVICE_CITIES.map((c) => c.city).join(", ")} — call us to
                confirm service at your address.
              </p>
              <PhoneLink
                label="service-areas-empty"
                className="mt-5 font-display text-xl font-bold text-ink transition-colors hover:text-gold-deep"
              />
            </div>
          ) : (
            <StaggerGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ordered.map((area) => (
                <StaggerItem key={area.slug} className="h-full">
                  <Link
                    href={`/service-areas/${area.slug}`}
                    className="group flex h-full flex-col rounded-3xl border border-line bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-lift"
                  >
                    <span className="grid size-11 place-items-center rounded-full bg-gold-soft">
                      <MapPin className="size-5 text-gold-deep" aria-hidden />
                    </span>
                    <h3 className="mt-4 font-display text-xl font-bold text-ink transition-colors group-hover:text-gold-deep">
                      {area.city}, {area.state}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                      {teaserFrom(area.body)}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-gold-deep">
                      HVAC in {area.city}
                      <ArrowRight
                        className="size-4 transition-transform group-hover:translate-x-1"
                        aria-hidden
                      />
                    </span>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </div>
      </section>

      {/* HQ map */}
      <section className="border-t border-line bg-paper py-16 sm:py-20">
        <div className="container-site grid items-center gap-10 lg:grid-cols-[380px_minmax(0,1fr)]">
          <Reveal>
            <p className="eyebrow">Home base</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">Our Houston headquarters.</h2>
            <address className="mt-5 not-italic leading-relaxed text-body">
              {COMPANY.name}
              <br />
              {COMPANY.address.street}
              <br />
              {COMPANY.address.city}, {COMPANY.address.state} {COMPANY.address.zip}
            </address>
            <p className="mt-3 text-sm text-muted">TX License {COMPANY.license}</p>
            <PhoneLink
              label="service-areas-hq"
              className="mt-5 font-display text-xl font-bold text-ink transition-colors hover:text-gold-deep"
            />
          </Reveal>
          <Reveal direction="left">
            <MapEmbed
              query={`${COMPANY.address.street}, ${COMPANY.address.city}, ${COMPANY.address.state} ${COMPANY.address.zip}`}
              title="Map to Golden Rule Air Conditioning & Heating headquarters"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
