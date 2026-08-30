import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ADMIN_ROLES, CONTENT_ROLES, ROLES } from "@/lib/auth";
import { requirePageSession, AccessDenied } from "@/components/admin/cms/guard";
import { TeamManager } from "@/components/admin/cms/TeamManager";
import type { UserDTO } from "@/components/admin/cms/shared";

export const metadata: Metadata = {
  title: "Team",
  alternates: { canonical: "/admin/team" },
};

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await requirePageSession(ADMIN_ROLES);
  if (!user) return <AccessDenied roles={ADMIN_ROLES} />;

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      title: true,
      active: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  const items: UserDTO[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    title: u.title,
    active: u.active,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <TeamManager
      initialUsers={items}
      currentUserId={user.id}
      roles={[...ROLES]}
      adminRoles={[...ADMIN_ROLES]}
      contentRoles={[...CONTENT_ROLES]}
    />
  );
}
