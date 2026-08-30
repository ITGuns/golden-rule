import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { COMPANY, DIVISIONS } from "@/lib/site";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Building2, HardHat } from "lucide-react";

export const metadata: Metadata = {
  title: "New Construction HVAC — Houston TX",
  description:
    "Commercial new construction HVAC in Greater Houston. A properly installed system is the lifeblood of a building — see our past projects and request an estimate.",
  alternates: { canonical: "/new-construction" },
};

export const revalidate = 300;

const division = DIVISIONS.NEW_CONSTRUCTION;

/** The construction-projects body is a heading plus a bullet list of past project names. */
function extractProjects(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => /^[-*+]\s+\S/.test(l))
    .map((l) => l.replace(/^[-*+]\s+/, ""));
}

export default async function NewConstructionPage() {
  const service = await db.service.findUnique({
    where: { slug: "construction-projects" },
  });
  const projects =
    service && service.published && service.division === "NEW_CONSTRUCTION"
      ? extractProjects(service.body)
      : [];

  return (
    <>
      <PageHero
        eyebrow="New Construction division"
        title="HVAC built into the building, from day one."
        intro={division.blurb}
        image="/images/construction_projects_2050x700.webp"
      >
        <div className="flex flex-wrap items-center gap-4">
          <ButtonLink href="/request-estimate" size="lg">
            Request Estimate
          </ButtonLink>
          <PhoneLink
            label="new-construction-hero"
            className="font-display text-lg font-bold text-white transition-colors hover:text-gold"
          />
        </div>
      </PageHero>

      {/* Division intro */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <p className="eyebrow">One of three divisions</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              The lifeblood of a healthy building.
            </h2>
            <p className="mt-5 leading-relaxed text-body">{division.blurb}</p>
            <p className="mt-4 leading-relaxed text-body">{COMPANY.tagline}</p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3 text-sm text-body">
                <HardHat className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden />
                Full-service mechanical contractor, founded {COMPANY.founded} — TX License{" "}
                {COMPANY.license}.
              </li>
              <li className="flex items-start gap-3 text-sm text-body">
                <Building2 className="mt-0.5 size-5 shrink-0 text-gold-deep" aria-hidden />
                Keeping you, your customers, employees, and residents safe and healthy.
              </li>
            </ul>
          </Reveal>
          <Reveal direction="left">
            <div className="relative aspect-video overflow-hidden rounded-3xl border border-line shadow-lift">
              <Image
                src="/images/new_construction_1024x576.jpg"
                alt="New construction HVAC installation in progress"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Past projects wall */}
      <section className="bg-night py-16 text-white sm:py-20">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">Track record</p>
            <h2 className="display mt-3 max-w-2xl text-3xl !text-white sm:text-4xl">
              Past construction projects.
            </h2>
          </Reveal>
          {projects.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
              <p className="font-display text-lg font-bold text-white">
                Project list coming soon
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/60">
                Ask us about the buildings we&rsquo;ve completed across Greater Houston.
              </p>
              <PhoneLink
                label="new-construction-empty"
                className="mt-5 font-display text-xl font-bold text-gold transition-colors hover:text-white"
              />
            </div>
          ) : (
            <StaggerGroup
              stagger={0.015}
              className="mt-10 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {projects.map((name, i) => (
                <StaggerItem key={`${name}-${i}`}>
                  <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/85 transition-colors duration-300 hover:border-gold/40 hover:text-white">
                    {name}
                  </p>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </div>
      </section>

      {/* Estimate CTA */}
      <section className="border-b border-line bg-paper py-14">
        <div className="container-site flex flex-wrap items-center justify-between gap-6">
          <Reveal>
            <h2 className="display text-2xl sm:text-3xl">Breaking ground on something new?</h2>
            <p className="mt-2 max-w-xl text-muted">
              Bring us your plans — we&rsquo;ll scope the mechanical work and put a real
              number on it.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap items-center gap-4">
            <ButtonLink href="/request-estimate">Request Estimate</ButtonLink>
            <PhoneLink
              label="new-construction-cta"
              className="font-display text-lg font-bold text-ink transition-colors hover:text-gold-deep"
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
