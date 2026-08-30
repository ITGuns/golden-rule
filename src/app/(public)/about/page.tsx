import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { COMPANY, CERTIFICATIONS, DIVISIONS, SITE_URL } from "@/lib/site";
import { HeartHandshake, ShieldCheck, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Founded in 2007, Golden Rule Air Conditioning & Heating is a full-service HVAC mechanical contractor operating out of Houston, Texas.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Integrity",
    body: "The Golden Rule brand is a symbol of integrity. We endeavor to apply the Golden Rule guiding principle in our dealings with suppliers, fellow contractors, our own employees, and our customers.",
  },
  {
    icon: HeartHandshake,
    title: "Honesty",
    body: "We strive to honor the name of Jesus Christ in everything that we do. Everyone involved is committed to obeying the Golden Rule — treating you the way we would want to be treated.",
  },
  {
    icon: Wrench,
    title: "Technical proficiency",
    body: "Our team of engineers, technicians, and service men are prepared to professionally represent the Golden Rule brand, backed by industry certifications and memberships including NATE, BBB, RSES, ACCA, and NCI.",
  },
] as const;

function AboutJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `About ${COMPANY.name}`,
    url: `${SITE_URL}/about`,
    description:
      "Founded in 2007, Golden Rule Air Conditioning & Heating is a full-service air conditioning and heating mechanical contractor operating out of Houston, Texas.",
    mainEntity: {
      "@type": "HVACBusiness",
      name: COMPANY.name,
      foundingDate: String(COMPANY.founded),
      telephone: "+12815007874",
      address: {
        "@type": "PostalAddress",
        streetAddress: COMPANY.address.street,
        addressLocality: COMPANY.address.city,
        addressRegion: COMPANY.address.state,
        postalCode: COMPANY.address.zip,
        addressCountry: "US",
      },
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function AboutPage() {
  return (
    <>
      <AboutJsonLd />
      <PageHero
        eyebrow="Our Company"
        title="About Golden Rule"
        intro="Founded in 2007, Golden Rule Air Conditioning & Heating is a full-service air conditioning and heating mechanical contractor, operating out of Houston, Texas."
      />

      {/* Story */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal direction="right">
            <div className="overflow-hidden rounded-3xl border border-line shadow-lift">
              <Image
                src="/images/27331977_1935965523178376_3166800883104034615_n.jpg"
                alt="The Golden Rule Air Conditioning & Heating team in front of their service trucks"
                width={960}
                height={419}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-auto w-full object-cover"
              />
            </div>
          </Reveal>
          <Reveal direction="left">
            <p className="eyebrow">Since 2007</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              A symbol of integrity, honesty, and technical proficiency
            </h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-body">
              <p>
                We hold several business- and industry-related certifications and
                memberships, including NATE, BBB, RSES, ACCA, and NCI. Our team of
                engineers, technicians, and service men are prepared to
                professionally represent the Golden Rule brand.
              </p>
              <p>
                We endeavor to apply the Golden Rule guiding principle in our
                dealings with suppliers, fellow contractors, our own employees,
                and our customers.
              </p>
            </div>
            <p className="mt-6 text-sm font-semibold text-muted">
              {COMPANY.name} · {COMPANY.address.street} {COMPANY.address.city},{" "}
              {COMPANY.address.state} {COMPANY.address.zip} · Texas License{" "}
              {COMPANY.license}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Certifications strip */}
      <section
        className="border-y border-line bg-paper py-12"
        aria-labelledby="certifications-heading"
      >
        <div className="container-site">
          <h2 id="certifications-heading" className="eyebrow text-center">
            Certifications &amp; Memberships
          </h2>
          <StaggerGroup className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {CERTIFICATIONS.map((cert) => (
              <StaggerItem key={cert.key} className="flex items-center">
                {cert.image ? (
                  <Image
                    src={cert.image}
                    alt={cert.label}
                    width={140}
                    height={56}
                    className="h-12 w-auto object-contain"
                  />
                ) : (
                  <span className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold tracking-wide text-ink">
                    {cert.label}
                  </span>
                )}
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Why Golden Rule */}
      <section
        id="why"
        className="scroll-mt-[88px] bg-white py-16 sm:py-20"
        aria-labelledby="why-heading"
      >
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">Why Golden Rule</p>
            <h2 id="why-heading" className="display mt-3 max-w-2xl text-3xl sm:text-4xl">
              The standard we hold ourselves to
            </h2>
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-6 md:grid-cols-3">
            {VALUES.map((value) => (
              <StaggerItem key={value.title}>
                <Card className="h-full p-7">
                  <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold-soft">
                    <value.icon className="size-6 text-ink" aria-hidden />
                  </span>
                  <h3 className="display mt-5 text-xl">{value.title}</h3>
                  <p className="mt-3 leading-relaxed text-body">{value.body}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <Reveal className="mt-16">
            <p className="eyebrow">Three divisions to serve you</p>
            <h3 className="display mt-3 max-w-2xl text-2xl sm:text-3xl">
              Residential, Commercial, and New Construction
            </h3>
          </Reveal>
          <StaggerGroup className="mt-8 grid gap-6 md:grid-cols-3">
            {Object.entries(DIVISIONS).map(([key, division]) => (
              <StaggerItem key={key}>
                <Card className="group h-full overflow-hidden">
                  <div className="relative aspect-video overflow-hidden">
                    <Image
                      src={division.image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3">
                      <Image
                        src={division.icon}
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="size-10"
                      />
                      <h4 className="display text-lg">{division.label}</h4>
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-body">
                      {division.blurb}
                    </p>
                    <ButtonLink
                      href={division.href}
                      variant="outline"
                      size="sm"
                      className="mt-5"
                    >
                      Explore {division.label}
                    </ButtonLink>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Guiding principle + hiring */}
      <section className="bg-night py-16 sm:py-20" aria-labelledby="hiring-heading">
        <div className="container-site max-w-4xl text-center">
          <Reveal>
            <p className="eyebrow !text-gold">Our Guiding Principle</p>
            <blockquote className="display mx-auto mt-6 max-w-3xl text-2xl leading-snug !text-white sm:text-3xl">
              {COMPANY.guidingVerse}
            </blockquote>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/70">
              {COMPANY.missionNote}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <h2 id="hiring-heading" className="display mt-12 text-2xl !text-white sm:text-3xl">
              We are hiring!
            </h2>
            <p className="mx-auto mt-3 max-w-2xl leading-relaxed text-white/70">
              Want to work somewhere that treats its people the way it treats its
              customers? Join the Golden Rule team — or let us take care of your
              home or business first.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink href="/careers" size="lg">
                View Career Opportunities
              </ButtonLink>
              <ButtonLink href="/request-service" variant="outline-light" size="lg">
                Request Service
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-white/60">
              Prefer to talk?{" "}
              <PhoneLink
                className="font-semibold text-gold underline-offset-4 hover:underline"
                label="about-page"
              />
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
