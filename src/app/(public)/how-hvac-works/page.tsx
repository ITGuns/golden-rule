import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { HvacExplorer } from "@/components/three/HvacExplorer";
import { AirflowSection } from "@/components/three/AirflowSection";
import { ArticleCardView } from "@/components/home/ArticlesSection";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "How HVAC Works — Interactive Guide",
  description:
    "Explore an interactive 3D HVAC system: see how air moves from return to supply, what each component does, and get answers to common heating & cooling questions.",
  alternates: { canonical: "/how-hvac-works" },
};

export const revalidate = 300;

const FEATURED_SLUGS = [
  "how-does-your-central-air-conditioner-cool-your-home",
  "what-does-ac-seer-mean",
];

/** Accurate, generic HVAC education — intentionally free of business claims. */
const FAQS = [
  {
    q: "How often should I change my air filter?",
    a: "Most standard one-inch filters should be replaced every one to three months. Thicker media filters can last longer, while homes with pets, allergies, or heavy dust may need more frequent changes. A clean filter protects airflow, efficiency, and indoor air quality.",
  },
  {
    q: "What do SEER and SEER2 mean?",
    a: "SEER (Seasonal Energy Efficiency Ratio) measures how much cooling a system delivers per unit of electricity over a typical cooling season — the higher the number, the more efficient the system. SEER2 is the updated version of the rating, measured under revised test conditions that better reflect real-world installations.",
  },
  {
    q: "How does an air conditioner actually cool a home?",
    a: "An air conditioner doesn't create cold air — it moves heat. Refrigerant absorbs heat from indoor air at the evaporator coil, carries it outside, and releases it at the condenser coil. The same process also removes humidity, which is a big part of why conditioned air feels comfortable.",
  },
  {
    q: "What's the difference between a heat pump and an air conditioner?",
    a: "They use the same refrigeration cycle. The difference is that a heat pump has a reversing valve, so in winter it can run the cycle backward — pulling heat from outdoor air and moving it inside. One piece of equipment can then both heat and cool.",
  },
  {
    q: "Why is my AC blowing warm air?",
    a: "Common causes include a thermostat set to the wrong mode, a clogged air filter, a dirty or frozen evaporator coil, a tripped breaker at the outdoor unit, low refrigerant from a leak, or a failed capacitor. Some checks are simple; refrigerant and electrical issues call for a professional.",
  },
  {
    q: "Why does my system turn on and off so frequently?",
    a: "Rapid on-off cycling (short cycling) can come from an oversized system, a clogged filter, low refrigerant, a poorly placed thermostat, or an iced-up coil. It wastes energy and wears out components, so it's worth diagnosing rather than ignoring.",
  },
  {
    q: "How often should heating and cooling equipment be professionally maintained?",
    a: "Industry guidance is a professional tune-up once a year for cooling (typically spring) and once a year for heating (typically fall). Regular maintenance keeps efficiency up, catches small problems early, and helps equipment reach its expected service life.",
  },
] as const;

function FaqJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function HowHvacWorksPage() {
  const articles = await db.article.findMany({
    where: { slug: { in: [...FEATURED_SLUGS] }, published: true },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <FaqJsonLd />

      <PageHero
        eyebrow="Comfort, explained"
        title="How your HVAC system works."
        intro="Walk through a living 3D model of a home comfort system — component by component, airflow stage by airflow stage — then dig deeper with plain-English answers."
        image="/images/air_conditioner_2050x700.jpg"
      />

      {/* Interactive 3D explorer */}
      <section className="border-t border-night-line bg-night py-16 text-white sm:py-20">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">Interactive model</p>
            <h2 className="display mt-3 max-w-2xl text-3xl !text-white sm:text-4xl">
              Meet every part of the system.
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/65">
              From the thermostat on your wall to the condenser outside — select a
              component to see where it lives and what it does.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <HvacExplorer />
          </Reveal>
        </div>
      </section>

      {/* Airflow journey */}
      <section className="border-t border-night-line bg-night py-16 text-white sm:py-20">
        <div className="container-site">
          <Reveal>
            <p className="eyebrow">Follow the air</p>
            <h2 className="display mt-3 max-w-2xl text-3xl !text-white sm:text-4xl">
              One loop, three jobs: cool, heat, clean.
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/65">
              Air in your home travels a continuous loop. Switch modes to see how the
              same path delivers cooling, heating, and filtration.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-10">
            <AirflowSection />
          </Reveal>
        </div>
      </section>

      {/* Deeper reading */}
      {articles.length > 0 && (
        <section className="bg-paper py-16 sm:py-20">
          <div className="container-site">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Go deeper</p>
                <h2 className="display mt-3 text-3xl sm:text-4xl">
                  From our Knowledge Center.
                </h2>
              </div>
              <ButtonLink href="/news" variant="outline">
                All articles
              </ButtonLink>
            </Reveal>
            <StaggerGroup className="mt-10 grid gap-6 md:grid-cols-2 lg:max-w-4xl">
              {articles.map((a) => (
                <StaggerItem key={a.slug} className="h-full">
                  <ArticleCardView
                    article={{
                      slug: a.slug,
                      title: a.title,
                      excerpt: a.excerpt,
                      category: a.category,
                      heroImage: a.heroImage,
                      publishedAt: a.publishedAt?.toISOString() ?? null,
                      body: a.body,
                    }}
                  />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site max-w-3xl">
          <Reveal>
            <p className="eyebrow">Common questions</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">HVAC questions, answered.</h2>
          </Reveal>
          <div className="mt-10 divide-y divide-line rounded-3xl border border-line bg-white">
            {FAQS.map((f) => (
              <details key={f.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-base font-bold text-ink transition-colors hover:text-gold-deep [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <ChevronDown
                    className="size-5 shrink-0 text-muted transition-transform duration-300 group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-body">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">
            Still curious? Browse the{" "}
            <Link
              href="/news"
              className="font-semibold text-gold-deep underline underline-offset-4"
            >
              Knowledge Center
            </Link>{" "}
            for more plain-English HVAC education.
          </p>
        </div>
      </section>
    </>
  );
}
