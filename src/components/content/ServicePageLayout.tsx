import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, ShieldCheck, Sparkles } from "lucide-react";
import { COMPANY, DIVISIONS, SERVICE_CITIES, SITE_URL, type DivisionKey } from "@/lib/site";
import { RichBody } from "@/components/content/RichBody";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

export type ServicePageService = {
  slug: string;
  name: string;
  division: string;
  excerpt: string;
  body: string;
  heroImage: string | null;
};

export type RelatedService = {
  slug: string;
  name: string;
  excerpt: string;
  heroImage: string | null;
};

function divisionInfo(division: string) {
  const key = (division in DIVISIONS ? division : "RESIDENTIAL") as DivisionKey;
  return DIVISIONS[key];
}

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Shared premium template for a single service page: cinematic hero, prose
 * body, sticky contact rail, related-services rail, and Service +
 * BreadcrumbList structured data.
 */
export function ServicePageLayout({
  service,
  related,
}: {
  service: ServicePageService;
  related: RelatedService[];
}) {
  const division = divisionInfo(service.division);
  const path = `${division.href}/${service.slug}`;

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    serviceType: service.name,
    description: service.excerpt,
    url: `${SITE_URL}${path}`,
    areaServed: SERVICE_CITIES.map((c) => `${c.city}, TX`),
    provider: {
      "@type": "HVACBusiness",
      name: COMPANY.name,
      telephone: "+12815007874",
      url: SITE_URL,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: division.label,
        item: `${SITE_URL}${division.href}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: service.name,
        item: `${SITE_URL}${path}`,
      },
    ],
  };

  return (
    <>
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <PageHero
        eyebrow={`${division.label} services`}
        title={service.name}
        intro={service.excerpt}
        image={service.heroImage}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/request-service" size="lg">
            Request Service
          </ButtonLink>
          <PhoneLink
            label={`service:${service.slug}`}
            className={
              service.heroImage
                ? "font-display text-lg font-bold text-white transition-colors hover:text-gold"
                : "font-display text-lg font-bold text-ink transition-colors hover:text-gold-deep"
            }
          />
        </div>
      </PageHero>

      {/* Breadcrumb trail */}
      <nav aria-label="Breadcrumb" className="border-b border-line bg-paper">
        <ol className="container-site flex flex-wrap items-center gap-1.5 py-3 text-sm text-muted">
          <li>
            <Link href="/" className="transition-colors hover:text-ink">
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li>
            <Link href={division.href} className="transition-colors hover:text-ink">
              {division.label}
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRight className="size-3.5" />
          </li>
          <li aria-current="page" className="font-semibold text-ink">
            {service.name}
          </li>
        </ol>
      </nav>

      {/* Body + sticky contact rail */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Reveal>
            <RichBody text={service.body} className="max-w-3xl" />
          </Reveal>

          <aside className="space-y-6 lg:sticky lg:top-[96px]" aria-label="Contact and programs">
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-paper px-6 py-4">
                <p className="eyebrow">Talk to a real person</p>
              </div>
              <div className="space-y-4 p-6">
                <PhoneLink
                  label={`service-aside:${service.slug}`}
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
                  TX License {COMPANY.license} · Serving Houston since {COMPANY.founded}
                </p>
              </div>
            </Card>

            <Link
              href="/maintenance"
              className="group block rounded-2xl bg-night p-6 text-white shadow-lift transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-gold">
                <Sparkles className="size-4" aria-hidden />
                GoldStandard&trade; Maintenance
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Scheduled test, inspect, monitor, clean &amp; adjust visits that keep your
                system safe and efficient.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
                Explore the program
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </aside>
        </div>
      </section>

      {/* Related services rail */}
      {related.length > 0 && (
        <section className="border-t border-line bg-paper py-16 sm:py-20">
          <div className="container-site">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Keep exploring</p>
                <h2 className="display mt-3 text-3xl sm:text-4xl">
                  More {division.label.toLowerCase()} services
                </h2>
              </div>
              <ButtonLink href={division.href} variant="outline">
                All {division.label.toLowerCase()} services
              </ButtonLink>
            </Reveal>
            <StaggerGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <StaggerItem key={r.slug}>
                  <Link
                    href={`${division.href}/${r.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift"
                  >
                    <div className="relative h-40 overflow-hidden bg-paper">
                      {r.heroImage && (
                        <Image
                          src={r.heroImage}
                          alt=""
                          fill
                          sizes="(max-width: 1024px) 100vw, 33vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-lg font-bold text-ink transition-colors group-hover:text-gold-deep">
                        {r.name}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
                        {r.excerpt}
                      </p>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-gold-deep">
                        Learn more
                        <ArrowRight
                          className="size-4 transition-transform group-hover:translate-x-1"
                          aria-hidden
                        />
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}
    </>
  );
}
