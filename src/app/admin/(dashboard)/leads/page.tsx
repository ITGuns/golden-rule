import { db } from "@/lib/db";
import { LeadsBoard } from "@/components/admin/crm/LeadsBoard";
import { toDTO, type LeadListItem, type TeamMember } from "@/components/admin/crm/types";

export const metadata = { title: "Leads — Golden Rule Admin" };
export const dynamic = "force-dynamic";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const autoNew = sp?.new === "1";

  const [leads, team] = await Promise.all([
    db.lead.findMany({
      include: {
        customer: true,
        assignedTo: { select: { id: true, name: true, role: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 400,
    }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true, title: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <LeadsBoard
      initialLeads={toDTO<LeadListItem[]>(leads)}
      team={toDTO<TeamMember[]>(team)}
      autoNew={autoNew}
    />
  );
}
