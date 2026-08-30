import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MapEmbed } from "@/components/layout/Embeds";
import { Reveal } from "@/components/motion/Reveal";
import { COMPANY, SITE_URL } from "@/lib/site";
import { BadgeCheck, Clock, MapPin } from "lucide-react";
import { ContactForm } from "./ContactForm";

const MAP_QUERY =
  "Golden Rule Air Conditioning & Heating 9306 Thomasville Dr Houston TX 77064";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Golden Rule Air Conditioning & Heating in Houston, TX. Call 281-500-RUSH (7874) — emergency service available — or send us a message online.",
  alternates: { canonical: "/contact" },
};

function ContactJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${COMPANY.name}`,
    url: `${SITE_URL}/contact`,
    mainEntity: {
      "@type": "HVACBusiness",
      name: COMPANY.name,
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

export default function ContactPage() {
  return (
    <>
      <ContactJsonLd />
      <PageHero
        eyebrow="Contact"
        title="Get In Touch With Golden Rule"
        intro="Call us, send a message, or stop by. However you reach out, expect to be treated the way we would want to be treated."
      />

      {/* Info + form */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site grid gap-10 lg:grid-cols-[2fr_3fr] lg:gap-14">
          <Reveal direction="right">
            <div className="space-y-6">
              <Card className="p-7">
                <p className="eyebrow">Give Us a Call</p>
                <PhoneLink
                  className="display mt-3 text-3xl font-bold text-ink hover:text-gold-deep"
                  showIcon={false}
                  label="contact-page"
                >
                  {COMPANY.phoneVanity}
                </PhoneLink>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-success">
                  <Clock className="size-4" aria-hidden />
                  {COMPANY.emergencyNote}
                </p>
              </Card>

              <Card className="p-7">
                <p className="eyebrow">Visit Us</p>
                <address className="mt-3 flex items-start gap-2 not-italic leading-relaxed text-body">
                  <MapPin className="mt-1 size-4 shrink-0 text-muted" aria-hidden />
                  <span>
                    {COMPANY.name}
                    <br />
                    {COMPANY.address.street}
                    <br />
                    {COMPANY.address.city}, {COMPANY.address.state}{" "}
                    {COMPANY.address.zip}
                  </span>
                </address>
                <p className="mt-4 flex items-center gap-2 text-sm text-muted">
                  <BadgeCheck className="size-4 shrink-0" aria-hidden />
                  Texas License {COMPANY.license}
                </p>
              </Card>

              <Card className="bg-paper p-7">
                <p className="eyebrow">Need a Technician?</p>
                <p className="mt-3 text-[15px] leading-relaxed text-body">
                  If your system needs attention, skip the form and request
                  service directly — it goes straight to our dispatch queue.
                </p>
                <ButtonLink href="/request-service" className="mt-5">
                  Request Service
                </ButtonLink>
              </Card>
            </div>
          </Reveal>

          <Reveal direction="left">
            <h2 className="display text-2xl sm:text-3xl">Send us a message</h2>
            <p className="mt-3 max-w-xl leading-relaxed text-muted">
              Have a question about our services, guarantees, or anything else?
              Fill out the form and our team will follow up.
            </p>
            <div className="mt-7">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Map */}
      <section
        className="border-t border-line bg-paper py-16"
        aria-labelledby="map-heading"
      >
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">Our Location</p>
            <h2 id="map-heading" className="display mt-3 text-2xl sm:text-3xl">
              Find us in Houston
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="mt-8">
            <MapEmbed
              query={MAP_QUERY}
              title="Map showing the Golden Rule Air Conditioning & Heating office in Houston, TX"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
