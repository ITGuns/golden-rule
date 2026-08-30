import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { ArticleCardView } from "@/components/home/ArticlesSection";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink } from "@/components/ui/Button";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Knowledge Center — HVAC Articles & Tips",
  description:
    "Plain-English HVAC education from Golden Rule Air Conditioning & Heating: cooling, heating, maintenance, indoor air quality, and energy efficiency articles.",
  alternates: { canonical: "/news" },
};

const CATEGORIES = [
  "Cooling",
  "Heating",
  "Maintenance",
  "Indoor Air Quality",
  "Energy Efficiency",
  "HVAC Education",
] as const;

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { category } = await searchParams;
  const raw = Array.isArray(category) ? category[0] : category;
  const active = CATEGORIES.find((c) => c === raw);

  const articles = await db.article.findMany({
    where: { published: true, ...(active ? { category: active } : {}) },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <>
      <PageHero
        eyebrow="Knowledge Center"
        title="Know your comfort system."
        intro="Straight answers about cooling, heating, air quality, and keeping your energy bills honest — written for homeowners, not engineers."
        compact
      />

      <section className="bg-white py-12 sm:py-16">
        <div className="container-site">
          {/* Category filter chips */}
          <nav aria-label="Filter articles by category">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href="/news"
                  aria-current={!active ? "page" : undefined}
                  className={cn(
                    "inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
                    !active
                      ? "border-ink bg-ink text-white"
                      : "border-line bg-white text-body hover:border-ink hover:text-ink"
                  )}
                >
                  All topics
                </Link>
              </li>
              {CATEGORIES.map((c) => (
                <li key={c}>
                  <Link
                    href={`/news?category=${encodeURIComponent(c)}`}
                    aria-current={active === c ? "page" : undefined}
                    className={cn(
                      "inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold transition-all duration-200",
                      active === c
                        ? "border-ink bg-gold text-ink shadow-gold"
                        : "border-line bg-white text-body hover:border-ink hover:text-ink"
                    )}
                  >
                    {c}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Results */}
          {articles.length === 0 ? (
            <div className="mt-10 rounded-3xl border border-dashed border-line bg-paper p-12 text-center">
              <p className="font-display text-lg font-bold text-ink">
                {active ? `No ${active} articles yet` : "No articles published yet"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                {active
                  ? "We haven't published anything in this topic yet — try another category or browse everything."
                  : "New articles are on the way. Check back soon."}
              </p>
              {active && (
                <div className="mt-6">
                  <ButtonLink href="/news" variant="outline">
                    Browse all articles
                  </ButtonLink>
                </div>
              )}
            </div>
          ) : (
            <>
              <Reveal className="mt-8">
                <p className="text-sm text-muted" aria-live="polite">
                  {articles.length} article{articles.length === 1 ? "" : "s"}
                  {active ? ` in ${active}` : ""}
                </p>
              </Reveal>
              <StaggerGroup className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
            </>
          )}
        </div>
      </section>
    </>
  );
}
