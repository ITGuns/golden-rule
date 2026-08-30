import type { Metadata } from "next";
import { db } from "@/lib/db";
import { COMPANY } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { MessageSquareQuote, Star } from "lucide-react";

export const metadata: Metadata = {
  title: "Customer Reviews — Houston TX",
  description:
    "What Houston-area customers say about Golden Rule Air Conditioning & Heating — reviews collected on our website. Had a great experience? Call 281-500-RUSH.",
  alternates: { canonical: "/reviews" },
};

export const revalidate = 300;

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website review",
  GOOGLE: "Google review",
  FACEBOOK: "Facebook review",
  OTHER: "Customer review",
};

function Stars({ rating }: { rating: number }) {
  const count = Math.max(0, Math.min(5, rating));
  return (
    <div className="flex gap-0.5" role="img" aria-label={`Rated ${count} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          aria-hidden
          className={i < count ? "size-4 fill-gold text-gold" : "size-4 text-line"}
        />
      ))}
    </div>
  );
}

export default async function ReviewsPage() {
  const reviews = await db.review.findMany({
    where: { published: true, isDemo: false },
    orderBy: { serviceDate: "desc" },
  });

  return (
    <>
      <PageHero
        eyebrow="Reviews"
        title="The Golden Rule, in their words."
        intro={`Every review below was collected on our website from customers we've served. ${COMPANY.missionNote}`}
      >
        {reviews.length > 0 && (
          <p className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-body">
            <MessageSquareQuote className="size-4 text-gold-deep" aria-hidden />
            {reviews.length} customer review{reviews.length === 1 ? "" : "s"} collected on
            our website
          </p>
        )}
      </PageHero>

      {/* Review wall */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site">
          {reviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-paper p-12 text-center">
              <p className="font-display text-lg font-bold text-ink">No reviews yet</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
                We&rsquo;re just getting this page started. If we&rsquo;ve served you,
                we&rsquo;d be honored to hear how it went — give us a call.
              </p>
              <PhoneLink
                label="reviews-empty"
                className="mt-5 font-display text-xl font-bold text-ink transition-colors hover:text-gold-deep"
              />
            </div>
          ) : (
            <StaggerGroup className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
              {reviews.map((r) => (
                <StaggerItem key={r.id} className="break-inside-avoid">
                  <figure className="rounded-3xl border border-line bg-white p-7 shadow-[0_1px_3px_rgb(0_0_0/0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lift">
                    <div className="flex items-center justify-between gap-4">
                      <Stars rating={r.rating} />
                      <Badge tone="neutral">{SOURCE_LABELS[r.source] ?? "Customer review"}</Badge>
                    </div>
                    {r.title && (
                      <p className="mt-4 font-display text-lg font-bold leading-snug text-ink">
                        {r.title}
                      </p>
                    )}
                    <blockquote className="mt-2.5 text-[15px] leading-relaxed text-body">
                      &ldquo;{r.text}&rdquo;
                    </blockquote>
                    {r.response && (
                      <div className="mt-4 rounded-2xl bg-paper p-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-gold-deep">
                          Response from {COMPANY.shortName}
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-body">{r.response}</p>
                      </div>
                    )}
                    <figcaption className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                      <span className="font-semibold text-ink">{r.customerName}</span>
                      <span aria-hidden>·</span>
                      <span>{formatDate(r.serviceDate ?? r.createdAt)}</span>
                    </figcaption>
                  </figure>
                </StaggerItem>
              ))}
            </StaggerGroup>
          )}
        </div>
      </section>

      {/* Share-your-experience CTA */}
      <section className="bg-night py-16 text-white">
        <div className="container-site flex flex-wrap items-center justify-between gap-6">
          <Reveal>
            <p className="eyebrow">Had a great experience?</p>
            <h2 className="display mt-3 max-w-xl text-3xl !text-white sm:text-4xl">
              Tell us — it means everything.
            </h2>
            <p className="mt-3 max-w-xl text-white/70">
              Call and let us know how your visit went, good or bad. It&rsquo;s how we
              keep the Golden Rule.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-wrap items-center gap-4">
            <PhoneLink
              label="reviews-cta"
              className="font-display text-2xl font-bold text-gold transition-colors hover:text-white"
            />
            <ButtonLink href="/contact" variant="outline-light">
              Contact us
            </ButtonLink>
          </Reveal>
        </div>
      </section>
    </>
  );
}
