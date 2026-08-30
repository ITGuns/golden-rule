import type { Metadata } from "next";
import { db } from "@/lib/db";
import { CONTENT_ROLES } from "@/lib/auth";
import { requirePageSession, AccessDenied } from "@/components/admin/cms/guard";
import { ServicesManager } from "@/components/admin/cms/ServicesManager";
import type { ServiceDTO } from "@/components/admin/cms/shared";

export const metadata: Metadata = {
  title: "Services",
  alternates: { canonical: "/admin/services" },
};

export const dynamic = "force-dynamic";

export default async function ServicesAdminPage() {
  const user = await requirePageSession(CONTENT_ROLES);
  if (!user) return <AccessDenied roles={CONTENT_ROLES} />;

  const services = await db.service.findMany({
    orderBy: [{ division: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  const items: ServiceDTO[] = services.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    division: s.division,
    excerpt: s.excerpt,
    body: s.body,
    heroImage: s.heroImage,
    published: s.published,
    sortOrder: s.sortOrder,
  }));

  return <ServicesManager initialServices={items} />;
}
