import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { COMPANY } from "@/lib/site";
import { RichBody } from "@/components/content/RichBody";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import {
  Activity,
  ArrowRight,
  Building2,
  CalendarClock,
  ClipboardCheck,
  Gauge,
  ShieldCheck,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";

export const metadata: Metadata = {
  title: "GoldStandard™ Maintenance — Houston TX",
  description:
    "GoldStandard™ scheduled HVAC maintenance in Houston: we test, inspect, monitor, clean & adjust your system with precise instruments for safe, efficient operation.",
  alternates: { canonical: "/maintenance" },
};

export const revalidate = 300;

/** The five verbs of every GoldStandard™ visit — straight from the program copy. */
const PILLARS = [
  { icon: Gauge, verb: "Test", note: "Controls, safeties & performance" },
  { icon: ClipboardCheck, verb: "Inspect", note: "Components, ducts & wiring" },
  { icon: Activity, verb: "Monitor", note: "Operating temperatures & charge" },
  { icon: Sparkles, verb: "Clean", note: "Coils, burners & blower components" },
  { icon: SlidersHorizontal, verb: "Adjust", note: "For safe, efficient operation" },
] as const;

/** Member benefits, summarized from the program body copy below. */
const BENEFITS = [
  { title: "Increase equipment safety", note: "Trained to recognize and correct potentially dangerous problems." },
  { title: "Add years to equipment life", note: "Correcting problems before they cause damage." },
  { title: "Save money on repairs", note: "Members save up to 15% should your system ever need repair." },
  { title: "Be a priority customer", note: "GoldStandard™ members are served first." },
  { title: "Plan for the future", note: "Membership is transferable if you sell your home (some restrictions apply)." },
] as const;

export default async function MaintenancePage() {
  const service = await db.service.findUnique({ where: { slug: "maintenance" } });
  const published = service && service.published ? service : null;

  return (
    <>
      <PageHero
        eyebrow="GoldStandard™ program"
        title="Maintenance that keeps its promises."
        intro="Quality workmanship on a schedule: we test, inspect, monitor, clean, and adjust your system using advanced and precise instruments to ensure safe and efficient system operation."
        image={published?.heroImage ?? "/images/maintenance_2050x700.jpg"}
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/request-service" size="lg">
            Protect Your Comfort
          </ButtonLink>
          <PhoneLink
            label="maintenance-hero"
            className="font-display text-lg font-bold text-white transition-colors hover:text-gold"
          />
        </div>
      </PageHero>

      {/* The five verbs */}
      <section className="border-b border-line bg-white py-14 sm:py-16">
        <div className="container-site">
          <Reveal className="text-center">
            <p className="eyebrow">Every visit, every system</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              Test. Inspect. Monitor. Clean. Adjust.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted">
              It&rsquo;s like changing the oil in your car — scheduled care that protects
              the investment behind your comfort.
            </p>
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {PILLARS.map((p) => (
              <StaggerItem key={p.verb} className="h-full">
                <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-line bg-paper p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-lift">
                  <span className="grid size-12 place-items-center rounded-full bg-gold-soft">
                    <p.icon className="size-6 text-gold-deep" aria-hidden />
                  </span>
                  <p className="font-display text-lg font-bold uppercase tracking-wider text-ink">
                    {p.verb}
                  </p>
                  <p className="text-sm leading-relaxed text-muted">{p.note}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Member benefits at a glance */}
      <section className="bg-night py-16 text-white sm:py-20">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">Membership benefits</p>
            <h2 className="display mt-3 max-w-2xl text-3xl !text-white sm:text-4xl">
              What GoldStandard&trade; members get.
            </h2>
          </Reveal>
          <StaggerGroup className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {BENEFITS.map((b) => (
              <StaggerItem key={b.title} className="h-full">
                <div className="flex h-full flex-col gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors duration-300 hover:border-gold/40">
                  <ShieldCheck className="size-5 text-gold" aria-hidden />
                  <p className="font-display text-sm font-bold leading-snug text-white">{b.title}</p>
                  <p className="text-xs leading-relaxed text-white/65">{b.note}</p>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      {/* Full program details + sticky rail */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Reveal>
            <p className="eyebrow">Program specifications</p>
            <h2 className="display mb-2 mt-3 text-3xl sm:text-4xl">
              The checklists, in full.
            </h2>
            {published ? (
              <RichBody text={published.body} className="max-w-3xl" />
            ) : (
              <div className="mt-8 rounded-3xl border border-dashed border-line bg-paper p-12 text-center">
                <p className="font-display text-lg font-bold text-ink">
                  Program details are being published
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                  Call us for the full GoldStandard&trade; maintenance specifications
                  and membership details.
                </p>
                <PhoneLink
                  label="maintenance-empty"
                  className="mt-5 font-display text-xl font-bold text-ink transition-colors hover:text-gold-deep"
                />
              </div>
            )}
          </Reveal>

          <aside className="space-y-6 lg:sticky lg:top-[96px]" aria-label="Join and related programs">
            <Card className="overflow-hidden">
              <div className="border-b border-line bg-paper px-6 py-4">
                <p className="eyebrow">Protect your comfort</p>
              </div>
              <div className="space-y-4 p-6">
                <p className="flex items-start gap-3 text-sm leading-relaxed text-body">
                  <CalendarClock className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden />
                  Request a visit and ask about GoldStandard&trade; membership — we&rsquo;ll
                  take care of the schedule from there.
                </p>
                <div className="grid gap-2.5">
                  <ButtonLink href="/request-service" className="w-full">
                    Request Service
                  </ButtonLink>
                  <ButtonLink href="/request-estimate" variant="outline" className="w-full">
                    Request Estimate
                  </ButtonLink>
                </div>
                <PhoneLink
                  label="maintenance-aside"
                  className="font-display text-xl font-bold text-ink transition-colors hover:text-gold-deep"
                />
                <p className="text-xs text-muted">
                  {COMPANY.phoneVanity} · {COMPANY.emergencyNote}
                </p>
              </div>
            </Card>

            <Link
              href="/commercial/commercial-maintenance"
              className="group block rounded-2xl bg-night p-6 text-white shadow-lift transition-transform duration-300 hover:-translate-y-1"
            >
              <p className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-gold">
                <Building2 className="size-4" aria-hidden />
                Commercial building?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Planned maintenance for commercial AC, heating, refrigeration, and
                kitchen equipment.
              </p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-gold">
                Commercial maintenance
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          </aside>
        </div>
      </section>

      {/* Protect Your Comfort CTA */}
      <section className="border-b border-line bg-paper py-14">
        <div className="container-site flex flex-wrap items-center justify-between gap-6">
          <Reveal>
            <h2 className="display text-2xl sm:text-3xl">Protect your comfort.</h2>
            <p className="mt-2 max-w-xl text-muted">
              An ounce of prevention is worth a pound of cure — get on the schedule
              before the season does its worst.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap items-center gap-4">
            <ButtonLink href="/request-service">Protect Your Comfort</ButtonLink>
            <PhoneLink
              label="maintenance-cta"
              className="font-display text-lg font-bold text-ink transition-colors hover:text-gold-deep"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
