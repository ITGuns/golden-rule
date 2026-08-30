import { db } from "@/lib/db";
import { MissedCallsTable } from "@/components/admin/crm/MissedCallsTable";
import { toDTO, type MissedCallDTO } from "@/components/admin/crm/types";

export const metadata = { title: "Missed Calls" };
export const dynamic = "force-dynamic";

export default async function MissedCallsPage() {
  const calls = await db.missedCall.findMany({
    include: { lead: { select: { id: true, name: true, status: true } } },
    orderBy: { callTime: "desc" },
    take: 300,
  });

  return <MissedCallsTable initialCalls={toDTO<MissedCallDTO[]>(calls)} />;
}
