import Image from "next/image";
import Link from "next/link";
import { COMPANY, GUARANTEES, VIDEOS } from "@/lib/site";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { Counter } from "@/components/motion/Counter";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function WhyGoldenRule() {
  const years = new Date().getFullYear() - COMPANY.founded;
  // The verse constant ends with an "— Matthew 7:12" attribution — split it out
  // so the quote card can render a distinct attribution line (text stays verbatim).
  const [verseText, verseSource] = COMPANY.guidingVerse.split(" — ");

  return (
    <section id="why" className="bg-white py-24">
      <div className="container-site">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <Reveal direction="right">
            <p className="eyebrow">Why Golden Rule</p>
            <h2 className="display mt-4 text-4xl sm:text-5xl">
              Integrity, honesty, and technical proficiency — since {COMPANY.founded}.
            </h2>
            <p className="mt-5 leading-relaxed text-body">
              Golden Rule Air Conditioning &amp; Heating is a full-service air conditioning and
              heating mechanical contractor operating out of Houston, Texas. We hold several
              business- and industry-related certifications and memberships, including NATE, BBB,
              RSES, ACCA, and NCI. Our team of engineers, technicians, and service men are prepared
              to professionally represent the Golden Rule brand: a symbol of integrity, honesty,
              and technical proficiency.
            </p>

            {/* guiding verse — elevated quote card */}
            <figure className="relative mt-7 overflow-hidden rounded-3xl border border-gold/30 bg-paper p-6 pl-7 sm:p-7 sm:pl-8">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-4 left-2.5 select-none font-display text-7xl font-bold leading-none text-gold/30"
              >
                &ldquo;
              </span>
              <blockquote className="relative italic leading-relaxed text-body">
                {verseText ?? COMPANY.guidingVerse}
              </blockquote>
              {verseSource && (
                <figcaption className="relative mt-3 flex items-center gap-2.5">
                  <span className="h-px w-6 bg-gold" aria-hidden />
                  <span className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-gold-deep">
                    {verseSource}
                  </span>
                </figcaption>
              )}
            </figure>
            <p className="mt-3 text-sm text-muted">
              We endeavor to apply this guiding principle in our dealings with our suppliers, our
              fellow contractors, our own employees, and our customers.
            </p>

            {/* stats — paper tiles with gold numerals */}
            <div className="mt-8 grid grid-cols-3 gap-3.5">
              <div className="rounded-2xl border border-line bg-paper p-4 transition-colors duration-300 hover:border-gold/40 sm:p-5">
                <p className="font-display text-3xl font-bold tabular-nums text-gold-deep sm:text-4xl">
                  <Counter to={years} suffix="+" />
                </p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase leading-snug tracking-wide text-muted">
                  Years serving Houston
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-4 transition-colors duration-300 hover:border-gold/40 sm:p-5">
                <p className="font-display text-3xl font-bold tabular-nums text-gold-deep sm:text-4xl">
                  3
                </p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase leading-snug tracking-wide text-muted">
                  Divisions: home, business &amp; construction
                </p>
              </div>
              <div className="rounded-2xl border border-line bg-paper p-4 transition-colors duration-300 hover:border-gold/40 sm:p-5">
                <p className="font-display text-3xl font-bold tabular-nums text-gold-deep sm:text-4xl">
                  <Counter to={5} />
                </p>
                <p className="mt-1.5 text-[11px] font-semibold uppercase leading-snug tracking-wide text-muted">
                  Gold Plated Guarantees
                </p>
              </div>
            </div>

            <div className="mt-9 flex flex-wrap gap-4">
              <ButtonLink href="/about" className="group !rounded-full">
                Our Story
                <ArrowRight
                  className="size-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                />
              </ButtonLink>
              <ButtonLink
                href="/gold-plated-guarantees"
                variant="outline"
                className="!rounded-full"
              >
                The Guarantees
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal direction="left" className="space-y-8">
            {/* team photo with offset gold frame + floating badge */}
            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-1.5 translate-x-3 translate-y-3 rotate-[1.2deg] rounded-3xl border-2 border-gold/70"
              />
              <div className="relative overflow-hidden rounded-3xl border border-line bg-white shadow-lift">
                <Image
                  src="/images/27331977_1935965523178376_3166800883104034615_n.jpg"
                  alt="The Golden Rule team in front of their service trucks"
                  width={960}
                  height={419}
                  className="w-full object-cover"
                />
                <span className="absolute bottom-4 left-4 rounded-lg bg-night/70 px-3 py-1.5 font-display text-[11px] font-bold uppercase tracking-[0.18em] text-gold backdrop-blur-md">
                  Est. {COMPANY.founded} &middot; Houston, TX
                </span>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-line shadow-lift">
              <div className="relative aspect-video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${VIDEOS.homepage}`}
                  title="Golden Rule Air Conditioning & Heating"
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          </Reveal>
        </div>

        {/* guarantees teaser */}
        <StaggerGroup className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {GUARANTEES.map((g) => (
            <StaggerItem key={g.title} className="h-full">
              <Link
                href="/gold-plated-guarantees"
                className="group flex h-full flex-col items-center gap-3 rounded-3xl border border-line bg-paper p-5 text-center transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-gold hover:shadow-lift"
              >
                <span className="rounded-full p-1 ring-2 ring-gold/40 transition-all duration-300 group-hover:ring-gold">
                  <Image
                    src={g.icon}
                    alt=""
                    width={56}
                    height={56}
                    className="size-14 rounded-full"
                  />
                </span>
                <p className="font-display text-sm font-bold leading-snug text-ink">{g.title}</p>
                <span className="mt-auto inline-flex translate-y-1 items-center gap-1 text-xs font-semibold text-gold-deep opacity-0 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 group-hover:opacity-100">
                  <ShieldCheck className="size-3.5" aria-hidden /> Read the guarantee
                </span>
              </Link>
            </StaggerItem>
          ))}
        </StaggerGroup>
      </div>
    </section>
  );
}
