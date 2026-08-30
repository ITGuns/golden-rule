import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { COMPANY, SITE_URL } from "@/lib/site";
import { RichBody } from "@/components/content/RichBody";
import { MapEmbed } from "@/components/layout/Embeds";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/motion/Reveal";
import { ShieldCheck } from "lucide-react";

export const revalidate = 300;

export async function generateStaticParams() {
  const areas = await db.serviceArea.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return areas.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const area = await db.serviceArea.findUnique({ where: { slug } });
  if (!area || !area.published) return {};
  return {
    title: `${area.city} ${area.state} HVAC Services`,
    description: `Air conditioning, heating & HVAC maintenance in ${area.city}, ${area.state} from Golden Rule Air Conditioning & Heating. Call 281-500-RUSH.`,
    alternates: { canonical: `/service-areas/${area.slug}` },
  };
}

export default async function ServiceAreaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const area = await db.serviceArea.findUnique({ where: { slug } });
  if (!area || !area.published) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    name: COMPANY.name,
    url: `${SITE_URL}/service-areas/${area.slug}`,
    telephone: "+12815007874",
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.state,
      postalCode: COMPANY.address.zip,
      addressCountry: "US",
    },
    areaServed: {
      "@type": "City",
      name: `${area.city}, ${area.state}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero
        eyebrow="Service area"
        title={`HVAC services in ${area.city}, ${area.state}`}
        intro={`Air conditioning, heating, and maintenance for ${area.city} homes and businesses — from a Houston contractor that treats you the way we'd want to be treated.`}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/request-service" size="lg">
            Request Service
          </ButtonLink>
          <PhoneLink
            label={`area:${area.slug}`}
            className="font-display text-lg font-bold text-ink transition-colors hover:text-gold-deep"
          />
        </div>
      </PageHero>

      {/* Body + local rail */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Reveal>
            <RichBody text={area.body} className="max-w-3xl" />
          </Reveal>

          <aside className="space-y-6 lg:sticky lg:top-[96px]" aria-label={`Contact and map for ${area.city}`}>
            <MapEmbed
              query={`${area.city}, ${area.state}`}
              title={`Map of ${area.city}, ${area.state}`}
            />
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-paper px-6 py-4">
                <p className="eyebrow">Serving {area.city}</p>
              </div>
              <div className="space-y-4 p-6">
                <PhoneLink
                  label={`area-aside:${area.slug}`}
                  className="font-display text-2xl font-bold text-ink transition-colors hover:text-gold-deep"
                />
                <p className="text-sm text-muted">
                  {COMPANY.phoneVanity} · {COMPANY.emergencyNote}
                </p>
                <div className="grid gap-2.5">
                  <ButtonLink href="/request-service" className="w-full">
                    Request Service
                  </ButtonLink>
                  <ButtonLink href="/request-estimate" variant="outline" className="w-full">
                    Request Estimate
                  </ButtonLink>
                </div>
                <p className="flex items-center gap-2 text-xs text-muted">
                  <ShieldCheck className="size-4 text-gold-deep" aria-hidden />
                  TX License {COMPANY.license} · Since {COMPANY.founded}
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </section>

      {/* Local CTA */}
      <section className="border-b border-line bg-paper py-14">
        <div className="container-site flex flex-wrap items-center justify-between gap-6">
          <Reveal>
            <h2 className="display text-2xl sm:text-3xl">
              Need HVAC help in {area.city}?
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Tell us what&rsquo;s going on and we&rsquo;ll get a technician headed your
              way.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap items-center gap-4">
            <ButtonLink href="/request-service">Request Service</ButtonLink>
            <PhoneLink
              label={`area-cta:${area.slug}`}
              className="font-display text-lg font-bold text-ink transition-colors hover:text-gold-deep"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
