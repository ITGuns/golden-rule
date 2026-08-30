import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ServicePageLayout } from "@/components/content/ServicePageLayout";

const DIVISION = "RESIDENTIAL";

export const revalidate = 300;

export async function generateStaticParams() {
  const services = await db.service.findMany({
    where: { division: DIVISION, published: true },
    select: { slug: true },
  });
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = await db.service.findUnique({ where: { slug } });
  if (!service || !service.published || service.division !== DIVISION) return {};
  return {
    title: `${service.name} | Houston TX`,
    description: service.excerpt.slice(0, 158),
    alternates: { canonical: `/residential/${service.slug}` },
  };
}

export default async function ResidentialServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = await db.service.findUnique({ where: { slug } });
  if (!service || !service.published || service.division !== DIVISION) notFound();

  const related = await db.service.findMany({
    where: { division: DIVISION, published: true, slug: { not: service.slug } },
    orderBy: { sortOrder: "asc" },
    take: 3,
    select: { slug: true, name: true, excerpt: true, heroImage: true },
  });

  return <ServicePageLayout service={service} related={related} />;
}
