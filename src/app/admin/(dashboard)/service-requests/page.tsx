import { db } from "@/lib/db";
import { ServiceRequestsTable } from "@/components/admin/crm/ServiceRequestsTable";
import { toDTO, type ServiceRequestDTO } from "@/components/admin/crm/types";

export const metadata = { title: "Service Requests" };
export const dynamic = "force-dynamic";

export default async function ServiceRequestsPage() {
  const requests = await db.serviceRequest.findMany({
    include: { lead: { select: { id: true, name: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return <ServiceRequestsTable initialRequests={toDTO<ServiceRequestDTO[]>(requests)} />;
}
