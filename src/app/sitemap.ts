import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/residential",
    "/commercial",
    "/new-construction",
    "/maintenance",
    "/products",
    "/how-hvac-works",
    "/gold-plated-guarantees",
    "/dare-installation-process",
    "/financing",
    "/specials",
    "/referral-program",
    "/about",
    "/careers",
    "/contact",
    "/reviews",
    "/news",
    "/service-areas",
    "/request-service",
    "/request-estimate",
    "/privacy-policy",
    "/terms",
    "/accessibility",
    "/site-map",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : path === "/request-service" ? 0.9 : 0.7,
  }));

  const [services, areas, articles] = await Promise.all([
    db.service.findMany({ where: { published: true } }),
    db.serviceArea.findMany({ where: { published: true } }),
    db.article.findMany({ where: { published: true } }),
  ]);

  return [
    ...staticRoutes,
    ...services
      .filter((s) => s.division !== "NEW_CONSTRUCTION")
      .map((s) => ({
        url: `${SITE_URL}/${s.division === "RESIDENTIAL" ? "residential" : "commercial"}/${s.slug}`,
        lastModified: new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
    ...areas.map((a) => ({
      url: `${SITE_URL}/service-areas/${a.slug}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: `${SITE_URL}/news/${a.slug}`,
      lastModified: a.updatedAt,
      changeFrequency: "yearly" as const,
      priority: 0.5,
    })),
  ];
}
