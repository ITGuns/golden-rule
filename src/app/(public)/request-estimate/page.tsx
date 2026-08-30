import type { Metadata } from "next";
import { BadgeCheck, HandCoins, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { Reveal } from "@/components/motion/Reveal";
import { EstimateRequestForm } from "@/components/forms/EstimateRequestForm";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request an Estimate | Golden Rule AC & Heating",
  description:
    "Request an estimate for AC installation, heating, or commercial HVAC work in the Houston area. Wells Fargo financing available. Call 281-500-RUSH.",
  alternates: { canonical: "/request-estimate" },
};

const POINTS = [
  {
    icon: BadgeCheck,
    text: `Licensed Texas HVAC contractor — ${COMPANY.license}, serving Houston since ${COMPANY.founded}.`,
  },
  {
    icon: ShieldCheck,
    text: "Installations backed by our 5 Gold Plated Guarantees, in writing.",
  },
  {
    icon: HandCoins,
    text: "Financing available through Wells Fargo on qualifying projects.",
  },
];

export default function RequestEstimatePage() {
  return (
    <>
      <PageHero
        compact
        eyebrow="Free to ask"
        title="Request an estimate"
        intro="Replacing a system, planning a project, or comparing bids? Tell us what you have in mind and we'll follow up to talk through options and schedule your estimate."
      />

      <section className="bg-white py-12 sm:py-16 dark:bg-night">
        <div className="container-site grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Reveal>
            <EstimateRequestForm />
          </Reveal>

          <div className="space-y-6 lg:sticky lg:top-[96px]">
            <Reveal delay={0.1}>
              <aside
                aria-label="What to expect"
                className="rounded-3xl border border-line bg-paper p-6 dark:border-night-line dark:bg-night-soft"
              >
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
                  Good to know
                </h2>
                <ul className="mt-4 space-y-4">
                  {POINTS.map((p, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-ink dark:bg-gold/15 dark:text-gold">
                        <p.icon className="size-4.5" aria-hidden />
                      </span>
                      <p className="text-sm leading-snug text-body dark:text-gray-300">{p.text}</p>
                    </li>
                  ))}
                </ul>
              </aside>
            </Reveal>

            <Reveal delay={0.18}>
              <aside
                aria-label="Talk to a person"
                className="rounded-3xl bg-night p-6 text-white shadow-lift"
              >
                <h2 className="display text-xl !text-white">Rather talk it through?</h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  Call us and describe your project — we&apos;re happy to answer questions before
                  you commit to anything. {COMPANY.emergencyNote}.
                </p>
                <PhoneLink
                  label="request_estimate_aside"
                  className="mt-4 rounded-xl bg-gold px-4 py-3 font-display text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
                >
                  {COMPANY.phoneVanity}
                </PhoneLink>
              </aside>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
