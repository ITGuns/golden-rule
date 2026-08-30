import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Hero } from "@/components/home/Hero";
import { TrustStrip } from "@/components/home/TrustStrip";
import { ServicesShowcase } from "@/components/home/ServicesShowcase";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyGoldenRule } from "@/components/home/WhyGoldenRule";
import { MaintenanceTimeline } from "@/components/home/MaintenanceTimeline";
import { BrandsSection } from "@/components/home/BrandsSection";
import { ReviewsSection } from "@/components/home/ReviewsSection";
import { ArticlesSection } from "@/components/home/ArticlesSection";
import { ServiceAreaMap } from "@/components/home/ServiceAreaMap";
import { FinalCta } from "@/components/home/FinalCta";

export const metadata: Metadata = {
  title: "Golden Rule Air Conditioning & Heating | Houston TX | HVAC Service & Repair",
  description:
    "Comfort engineered around you. Full-service Houston HVAC contractor since 2007 — residential, commercial & new construction. AC repair, heating, maintenance. 281-500-RUSH.",
  alternates: { canonical: "/" },
};

export const revalidate = 300;

export default async function HomePage() {
  const [reviews, articles] = await Promise.all([
    db.review.findMany({
      where: { published: true },
      orderBy: { serviceDate: "desc" },
      take: 8,
    }),
    db.article.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <>
      <Hero />
      <TrustStrip />
      <ServicesShowcase />
      <HowItWorks />
      <WhyGoldenRule />
      <MaintenanceTimeline />
      <BrandsSection />
      <ReviewsSection
        reviews={reviews.map((r) => ({
          id: r.id,
          title: r.title,
          text: r.text,
          customerName: r.customerName,
          rating: r.rating,
          serviceDate: r.serviceDate?.toISOString() ?? null,
        }))}
      />
      <ArticlesSection
        articles={articles.map((a) => ({
          slug: a.slug,
          title: a.title,
          excerpt: a.excerpt,
          category: a.category,
          heroImage: a.heroImage,
          publishedAt: a.publishedAt?.toISOString() ?? null,
          body: a.body,
        }))}
      />
      <ServiceAreaMap />
      <FinalCta />
    </>
  );
}
