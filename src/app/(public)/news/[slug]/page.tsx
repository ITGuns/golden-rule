import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { COMPANY, SITE_URL } from "@/lib/site";
import { formatDate, readTimeMinutes } from "@/lib/utils";
import { RichBody } from "@/components/content/RichBody";
import { ArticleCardView } from "@/components/home/ArticlesSection";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { ArrowLeft, CalendarDays, Clock } from "lucide-react";

export const revalidate = 300;

export async function generateStaticParams() {
  const articles = await db.article.findMany({
    where: { published: true },
    select: { slug: true },
  });
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await db.article.findUnique({ where: { slug } });
  if (!article || !article.published) return {};
  return {
    title: article.title.slice(0, 60),
    description: article.excerpt.slice(0, 158),
    alternates: { canonical: `/news/${article.slug}` },
    openGraph: article.heroImage
      ? { images: [{ url: article.heroImage }] }
      : undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await db.article.findUnique({ where: { slug } });
  if (!article || !article.published) notFound();

  const related = await db.article.findMany({
    where: {
      published: true,
      category: article.category,
      slug: { not: article.slug },
    },
    orderBy: { publishedAt: "desc" },
    take: 3,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    url: `${SITE_URL}/news/${article.slug}`,
    ...(article.heroImage ? { image: `${SITE_URL}${article.heroImage}` } : {}),
    ...(article.publishedAt ? { datePublished: article.publishedAt.toISOString() } : {}),
    dateModified: article.updatedAt.toISOString(),
    articleSection: article.category,
    author: { "@type": "Organization", name: COMPANY.name },
    publisher: {
      "@type": "Organization",
      name: COMPANY.name,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/brand/GOL_Logo-RGB-2.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PageHero eyebrow="Knowledge Center" title={article.title} image={article.heroImage}>
        <div
          className={
            article.heroImage
              ? "flex flex-wrap items-center gap-4 text-sm font-medium text-white/70"
              : "flex flex-wrap items-center gap-4 text-sm font-medium text-muted"
          }
        >
          <Badge tone="gold">{article.category}</Badge>
          {article.publishedAt && (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              {formatDate(article.publishedAt)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" aria-hidden />
            {readTimeMinutes(article.body)} min read
          </span>
        </div>
      </PageHero>

      {/* Article body */}
      <article className="bg-white py-14 sm:py-16">
        <div className="container-site max-w-3xl">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to Knowledge Center
          </Link>
          <div className="mt-8">
            <RichBody text={article.body} />
          </div>

          {/* In-article CTA */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-6 rounded-3xl bg-night p-8 text-white">
            <div>
              <p className="font-display text-xl font-bold text-white">
                Questions about your own system?
              </p>
              <p className="mt-1 text-sm text-white/70">
                Talk it through with a real Houston technician.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <ButtonLink href="/request-service">Request Service</ButtonLink>
              <PhoneLink
                label={`article:${article.slug}`}
                className="font-display text-lg font-bold text-white transition-colors hover:text-gold"
              />
            </div>
          </div>
        </div>
      </article>

      {/* Related reading */}
      {related.length > 0 && (
        <section className="border-t border-line bg-paper py-16 sm:py-20">
          <div className="container-site">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="eyebrow">Related reading</p>
                <h2 className="display mt-3 text-3xl sm:text-4xl">
                  More on {article.category.toLowerCase()}.
                </h2>
              </div>
              <ButtonLink
                href={`/news?category=${encodeURIComponent(article.category)}`}
                variant="outline"
              >
                All {article.category} articles
              </ButtonLink>
            </Reveal>
            <StaggerGroup className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
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
    </>
  );
}
