import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { LeadDetail } from "@/components/admin/crm/LeadDetail";
import { toDTO, type LeadFullDTO, type TeamMember } from "@/components/admin/crm/types";

export const metadata = { title: "Lead detail — Golden Rule Admin" };
export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [lead, team] = await Promise.all([
    db.lead.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true, role: true, title: true } },
        activities: {
          include: { user: { select: { id: true, name: true, role: true, title: true } } },
          orderBy: { createdAt: "desc" },
        },
        appointments: {
          include: { technician: { select: { id: true, name: true, role: true, title: true } } },
          orderBy: { start: "desc" },
        },
        estimates: { orderBy: { createdAt: "desc" } },
        messages: { orderBy: { createdAt: "asc" } },
        reviewRequests: { orderBy: { createdAt: "desc" } },
        serviceRequests: { orderBy: { createdAt: "desc" } },
      },
    }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true, title: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!lead) notFound();

  return <LeadDetail initialLead={toDTO<LeadFullDTO>(lead)} team={toDTO<TeamMember[]>(team)} />;
}
