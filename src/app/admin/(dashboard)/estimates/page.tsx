import { db } from "@/lib/db";
import { EstimatesTable } from "@/components/admin/crm/EstimatesTable";
import { toDTO, type EstimateDTO } from "@/components/admin/crm/types";

export const metadata = { title: "Estimates" };
export const dynamic = "force-dynamic";

export default async function EstimatesPage() {
  const estimates = await db.estimate.findMany({
    include: {
      lead: { select: { id: true, name: true, service: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return <EstimatesTable initialEstimates={toDTO<EstimateDTO[]>(estimates)} />;
}
