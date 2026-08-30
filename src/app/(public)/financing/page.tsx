import type { Metadata } from "next";
import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

const FINANCING_BANNER =
  "/images/Buy_NowPay_Later_Golden-Rule_AirConditioningHeating_Cypress77429773797738877070770907738277381773807706477086770187700977433773777737577002770047700777006_Repair_ReplaceMyAC.png";

export const metadata: Metadata = {
  title: "Financing",
  description:
    "Financing for your new comfort system is available through Wells Fargo. Call Golden Rule at 281-500-RUSH to explore current financing options.",
  alternates: { canonical: "/financing" },
};

const STEPS = [
  {
    step: "1",
    title: "Get your estimate",
    body: "Request an estimate for your repair or new system so you know exactly what the project involves.",
  },
  {
    step: "2",
    title: "Ask about financing",
    body: "Tell us you would like to explore financing through Wells Fargo and we will walk you through the current options.",
  },
  {
    step: "3",
    title: "The provider decides",
    body: "All credit and financing decisions are made by the financing provider, not by Golden Rule.",
  },
] as const;

export default function FinancingPage() {
  return (
    <>
      <PageHero
        eyebrow="Buy Now, Pay Later"
        title="Financing Through Wells Fargo"
        intro="A new comfort system is a big investment. Financing is available through Wells Fargo — call us to explore the options that fit your project."
      />

      {/* Banner + overview */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal direction="right">
            <div className="overflow-hidden rounded-3xl border border-line shadow-lift">
              <Image
                src={FINANCING_BANNER}
                alt="Buy now, pay later — financing available from Golden Rule Air Conditioning & Heating"
                width={600}
                height={350}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="h-auto w-full"
              />
            </div>
          </Reveal>
          <Reveal direction="left">
            <p className="eyebrow">How It Works</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              Spread the cost of comfort
            </h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-body">
              <p>
                Golden Rule Air Conditioning &amp; Heating offers financing
                through Wells Fargo. Because programs and terms change over
                time, we do not publish rates here — the best way to find out
                what is currently available is to talk with our office.
              </p>
              <p>
                Financing decisions are made by the financing provider. Our team
                can explain the process and help you get started when you
                request your estimate.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PhoneLink
                className="rounded-xl border-2 border-ink bg-gold px-7 py-3.5 text-base font-bold text-ink shadow-[0_5px_14px_rgb(0_0_0/0.25)] transition-all hover:bg-gold-deep"
                label="financing-explore"
              >
                Explore Financing: 281-500-7874
              </PhoneLink>
              <ButtonLink href="/request-estimate" variant="outline" size="lg">
                Request an Estimate
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Steps */}
      <section
        className="border-t border-line bg-paper py-16 sm:py-20"
        aria-labelledby="financing-steps-heading"
      >
        <div className="container-site">
          <Reveal className="text-center">
            <p className="eyebrow">Three Simple Steps</p>
            <h2 id="financing-steps-heading" className="display mt-3 text-2xl sm:text-3xl">
              Getting started is easy
            </h2>
          </Reveal>
          <StaggerGroup className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3">
            {STEPS.map((item) => (
              <StaggerItem key={item.step}>
                <Card className="h-full p-7">
                  <span className="display inline-flex size-10 items-center justify-center rounded-full bg-gold text-lg font-bold text-ink">
                    {item.step}
                  </span>
                  <h3 className="display mt-4 text-lg">{item.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-body">{item.body}</p>
                </Card>
              </StaggerItem>
            ))}
          </StaggerGroup>
          <Reveal delay={0.1} className="mt-10 text-center">
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted">
              Financing is subject to credit approval by the provider. Golden
              Rule does not make credit decisions and does not publish rates or
              terms — contact our office for current details.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  );
}
