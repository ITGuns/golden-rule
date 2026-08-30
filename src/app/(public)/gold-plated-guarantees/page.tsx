import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { GUARANTEES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Gold Plated Guarantees",
  description:
    "Five Gold Plated Guarantees back every Golden Rule installation — best price, critical components, 100% satisfaction, polite installers, and 24-hour hotel.",
  alternates: { canonical: "/gold-plated-guarantees" },
};

export default function GoldPlatedGuaranteesPage() {
  return (
    <>
      <PageHero
        eyebrow="Our Promise, In Writing"
        title="Gold Plated Guarantees"
        intro="Five guarantees stand behind every GoldCertified™ Comfort System we install. Here they are, word for word."
        image="/images/Plated.jpg"
      />

      {/* The five guarantees */}
      <section className="bg-white py-16 sm:py-20" aria-labelledby="guarantees-heading">
        <div className="container-site max-w-4xl">
          <h2 id="guarantees-heading" className="sr-only">
            The five Gold Plated Guarantees
          </h2>
          <StaggerGroup className="space-y-6">
            {GUARANTEES.map((guarantee, index) => (
              <StaggerItem key={guarantee.title}>
                <Card className="relative overflow-hidden p-7 sm:p-9">
                  <span
                    className="display pointer-events-none absolute -right-2 -top-5 text-8xl font-bold text-gold-soft select-none"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="relative flex flex-col gap-5 sm:flex-row sm:gap-7">
                    <div className="shrink-0">
                      <span className="inline-flex size-20 items-center justify-center rounded-2xl border border-line bg-paper">
                        <Image
                          src={guarantee.icon}
                          alt=""
                          width={56}
                          height={56}
                          className="size-14 object-contain"
                        />
                      </span>
                    </div>
                    <div>
                      <h3 className="display text-xl sm:text-2xl">{guarantee.title}</h3>
                      <p className="mt-3 leading-relaxed text-body">{guarantee.body}</p>
                    </div>
                  </div>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-line bg-paper py-16" aria-labelledby="guarantees-cta">
        <div className="container-site max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow">Ready When You Are</p>
            <h2 id="guarantees-cta" className="display mt-3 text-2xl sm:text-3xl">
              Contact us for more information, or schedule a visit with one of
              our consultants today
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted">
              Every guarantee above comes standard with a Golden Rule
              installation. Get your estimate and see the difference for
              yourself.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink href="/request-estimate" size="lg">
                Request an Estimate
              </ButtonLink>
              <ButtonLink href="/dare-installation-process" variant="outline" size="lg">
                See the DARE™ Process
              </ButtonLink>
            </div>
            <p className="mt-6 text-sm text-muted">
              Questions?{" "}
              <PhoneLink
                className="font-semibold text-ink underline-offset-4 hover:underline"
                label="guarantees-page"
              />
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
