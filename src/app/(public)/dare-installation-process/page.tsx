import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/motion/Reveal";
import { GUARANTEES } from "@/lib/site";

const bestPrice = GUARANTEES[0];

export const metadata: Metadata = {
  title: "DARE™ Installation Process",
  description:
    "DARE™ is the Golden Rule installation process — the standard behind our Best Price Guarantee. Dare to compare any published quote with all the features of DARE™.",
  alternates: { canonical: "/dare-installation-process" },
};

export default function DareInstallationProcessPage() {
  return (
    <>
      <PageHero
        eyebrow="Installation Done Right"
        title="The DARE™ Installation Process"
        intro="We believe that a DARE™ installation is the only way you can get the comfort and efficiency you paid for. That belief is so strong, we built a guarantee around it."
      />

      {/* Dare to compare */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal direction="right">
            <div className="overflow-hidden rounded-3xl border border-line bg-paper p-6 shadow-lift sm:p-10">
              <Image
                src="/images/Dare-to-Compare.jpg"
                alt="DARE to Compare — the Golden Rule installation process"
                width={480}
                height={190}
                sizes="(min-width: 1024px) 40vw, 90vw"
                className="mx-auto h-auto w-full max-w-md"
              />
            </div>
          </Reveal>
          <Reveal direction="left">
            <p className="eyebrow">Dare to Compare</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              An installation standard we put our money behind
            </h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-body">
              <p>
                DARE™ is the installation process behind every Golden Rule
                comfort system. A new system only delivers the comfort and
                efficiency it promises when the installation itself is done
                right — and DARE™ is how we hold every installation to that
                standard.
              </p>
              <p>
                It matters so much that our Best Price Guarantee — one of our
                five Gold Plated Guarantees — is written around it. Have a
                published quote from another company? Dare to compare it.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Best Price Guarantee tie-in */}
      <section
        className="border-y border-line bg-paper py-16 sm:py-20"
        aria-labelledby="best-price-heading"
      >
        <div className="container-site max-w-4xl">
          <Reveal>
            <Card className="border-2 border-gold p-8 shadow-gold sm:p-10">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
                <span className="inline-flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gold-soft">
                  <Image
                    src={bestPrice.icon}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 object-contain"
                  />
                </span>
                <div>
                  <p className="eyebrow">From Our Gold Plated Guarantees</p>
                  <h2 id="best-price-heading" className="display mt-2 text-2xl sm:text-3xl">
                    {bestPrice.title}
                  </h2>
                  <blockquote className="mt-4 leading-relaxed text-body">
                    “{bestPrice.body}”
                  </blockquote>
                </div>
              </div>
            </Card>
          </Reveal>
          <Reveal delay={0.15} className="mt-8 text-center">
            <ButtonLink href="/gold-plated-guarantees" variant="outline">
              See All Five Gold Plated Guarantees
            </ButtonLink>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white py-16" aria-labelledby="dare-cta">
        <div className="container-site max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow">Take the Dare</p>
            <h2 id="dare-cta" className="display mt-3 text-2xl sm:text-3xl">
              Get a quote worth comparing
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted">
              Request an estimate and ask us about the DARE™ installation
              process — we are happy to walk you through what it means for your
              home or business.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink href="/request-estimate" size="lg">
                Request an Estimate
              </ButtonLink>
              <PhoneLink
                className="rounded-xl border-2 border-ink px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-ink hover:text-white"
                label="dare-page"
              />
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
