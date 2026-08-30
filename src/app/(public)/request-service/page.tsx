import type { Metadata } from "next";
import { BadgeCheck, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { Reveal } from "@/components/motion/Reveal";
import { ServiceRequestWizard } from "@/components/forms/ServiceRequestWizard";
import { COMPANY, SERVICE_CITIES } from "@/lib/site";

export const metadata: Metadata = {
  title: "Request HVAC Service | Golden Rule AC & Heating",
  description:
    "Request air conditioning or heating service online in about two minutes. Golden Rule serves Houston, Cypress, Spring, Tomball, Katy & Sugar Land. 281-500-RUSH.",
  alternates: { canonical: "/request-service" },
};

const TRUST_POINTS = [
  {
    icon: BadgeCheck,
    title: `Licensed Texas contractor`,
    body: `TACL license ${COMPANY.license} — serving greater Houston since ${COMPANY.founded}.`,
  },
  {
    icon: ShieldCheck,
    title: "5 Gold Plated Guarantees",
    body: "Our installations and service are backed by written guarantees, in plain English.",
  },
  {
    icon: Sparkles,
    title: "The Golden Rule, literally",
    body: "Courteous technicians who treat your home the way they would want theirs treated.",
  },
  {
    icon: MapPin,
    title: "Local service area",
    body: SERVICE_CITIES.map((c) => c.city).join(", ") + " and nearby communities.",
  },
];

export default function RequestServicePage() {
  return (
    <>
      <PageHero
        compact
        eyebrow="Service request"
        title="Request service online"
        intro="Tell us what's going on in a few quick steps — about two minutes start to finish. Our dispatch team will follow up to confirm your appointment."
      />

      <section className="bg-white py-12 sm:py-16 dark:bg-night">
        <div className="container-site grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Reveal>
            <ServiceRequestWizard />
          </Reveal>

          <div className="space-y-6 lg:sticky lg:top-[96px]">
            <Reveal delay={0.1}>
              <aside
                aria-label="Emergency service"
                className="rounded-3xl bg-night p-6 text-white shadow-lift"
              >
                <p className="eyebrow">{COMPANY.emergencyNote}</p>
                <h2 className="display mt-2 text-xl !text-white">
                  No cooling? No heat? Don&apos;t wait on a form.
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/70">
                  If your home is uncomfortably hot or cold, or you smell gas or burning, call us
                  right away and we&apos;ll get you help.
                </p>
                <PhoneLink
                  label="request_service_emergency"
                  className="mt-4 rounded-xl bg-gold px-4 py-3 font-display text-lg font-bold text-ink transition-transform hover:-translate-y-0.5"
                >
                  {COMPANY.phoneVanity}
                </PhoneLink>
              </aside>
            </Reveal>

            <Reveal delay={0.18}>
              <aside
                aria-label="Why choose Golden Rule"
                className="rounded-3xl border border-line bg-paper p-6 dark:border-night-line dark:bg-night-soft"
              >
                <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
                  Why homeowners choose us
                </h2>
                <ul className="mt-4 space-y-4">
                  {TRUST_POINTS.map((t) => (
                    <li key={t.title} className="flex gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gold-soft text-ink dark:bg-gold/15 dark:text-gold">
                        <t.icon className="size-4.5" aria-hidden />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-ink dark:text-white">{t.title}</p>
                        <p className="mt-0.5 text-sm leading-snug text-muted">{t.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </aside>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  );
}
