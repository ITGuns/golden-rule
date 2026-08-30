import Image from "next/image";
import Link from "next/link";
import { formatDate, readTimeMinutes } from "@/lib/utils";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { ArrowRight, Clock } from "lucide-react";

export type ArticleCard = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  heroImage: string | null;
  publishedAt: string | null;
  body: string;
};

/** Gold underline that grows in from the left on card hover (background-size trick). */
const titleUnderline =
  "bg-gradient-to-r from-gold to-gold bg-[length:0%_2px] bg-left-bottom bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_2px]";

function MetaRow({ article, compact = false }: { article: ArticleCard; compact?: boolean }) {
  return (
    <p
      className={
        compact
          ? "flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted"
          : "flex items-center gap-3 text-[11px] font-semibold uppercase tracking-wider text-muted"
      }
    >
      {article.publishedAt && <span>{formatDate(article.publishedAt)}</span>}
      <span className="inline-flex items-center gap-1">
        <Clock className={compact ? "size-3" : "size-3.5"} aria-hidden />
        {readTimeMinutes(article.body)} min read
      </span>
    </p>
  );
}

/** Standard vertical article card — also used by /news. Keep this signature stable. */
export function ArticleCardView({ article }: { article: ArticleCard }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-lift"
    >
      <div className="relative h-48 overflow-hidden bg-paper">
        {article.heroImage && (
          <Image
            src={article.heroImage}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        )}
        <Badge tone="gold" className="absolute left-4 top-4 shadow-sm">
          {article.category}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-lg font-bold leading-snug text-ink">
          <span className={titleUnderline}>{article.title}</span>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{article.excerpt}</p>
        <div className="mt-auto pt-4">
          <MetaRow article={article} />
        </div>
      </div>
    </Link>
  );
}

/** Large editorial lead card — spans two columns on lg. */
function FeaturedArticle({ article }: { article: ArticleCard }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-lift"
    >
      <div className="relative h-72 shrink-0 overflow-hidden bg-paper">
        {article.heroImage && (
          <Image
            src={article.heroImage}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 66vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        )}
        <Badge tone="gold" className="absolute left-5 top-5 shadow-sm">
          {article.category}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-7">
        <h3 className="font-display text-2xl font-bold leading-snug text-ink">
          <span className={titleUnderline}>{article.title}</span>
        </h3>
        <p className="mt-3 line-clamp-3 leading-relaxed text-muted">{article.excerpt}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-6">
          <MetaRow article={article} />
          <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-gold-deep">
            Read article
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Compact horizontal card — 128px thumbnail left, content right. */
function CompactArticle({ article }: { article: ArticleCard }) {
  return (
    <Link
      href={`/news/${article.slug}`}
      className="group flex flex-1 items-stretch gap-4 rounded-3xl border border-line bg-white p-4 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-lift"
    >
      <div className="relative min-h-[104px] w-32 shrink-0 self-stretch overflow-hidden rounded-2xl bg-paper">
        {article.heroImage && (
          <Image
            src={article.heroImage}
            alt=""
            fill
            sizes="128px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-1">
        <p className="font-display text-[10.5px] font-bold uppercase tracking-[0.16em] text-gold-deep">
          {article.category}
        </p>
        <h3 className="mt-1.5 line-clamp-2 font-display text-[15.5px] font-bold leading-snug text-ink">
          <span className={titleUnderline}>{article.title}</span>
        </h3>
        <div className="mt-auto pt-3">
          <MetaRow article={article} compact />
        </div>
      </div>
    </Link>
  );
}

export function ArticlesSection({ articles }: { articles: ArticleCard[] }) {
  if (articles.length === 0) return null;
  const [featured, ...rest] = articles;
  const editorial = articles.length >= 3;

  return (
    <section className="bg-paper py-24">
      <div className="container-site">
        <Reveal className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Knowledge Center</p>
            <h2 className="display mt-4 text-4xl sm:text-5xl">Know your comfort system.</h2>
          </div>
          <ButtonLink href="/news" variant="outline" className="group !rounded-full">
            View all articles
            <ArrowRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-1"
              aria-hidden
            />
          </ButtonLink>
        </Reveal>

        {editorial ? (
          <StaggerGroup className="mt-12 grid gap-6 lg:grid-cols-3">
            <StaggerItem className="lg:col-span-2">
              <FeaturedArticle article={featured} />
            </StaggerItem>
            <StaggerItem className="flex flex-col gap-6">
              {rest.map((a) => (
                <CompactArticle key={a.slug} article={a} />
              ))}
            </StaggerItem>
          </StaggerGroup>
        ) : (
          <StaggerGroup className="mt-12 grid gap-6 md:grid-cols-2">
            {articles.map((a) => (
              <StaggerItem key={a.slug}>
                <ArticleCardView article={a} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </div>
    </section>
  );
}
