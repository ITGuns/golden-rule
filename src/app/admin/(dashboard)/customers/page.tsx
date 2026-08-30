import { db } from "@/lib/db";
import { CustomersTable } from "@/components/admin/crm/CustomersTable";
import { toDTO, type CustomerWithCounts } from "@/components/admin/crm/types";

export const metadata = { title: "Customers — Golden Rule Admin" };
export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const focusId = typeof sp?.focus === "string" ? sp.focus : null;

  const customers = await db.customer.findMany({
    include: {
      _count: { select: { leads: true, appointments: true } },
      leads: {
        select: { id: true, name: true, status: true, service: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
      appointments: {
        select: { id: true, service: true, start: true, status: true },
        orderBy: { start: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <CustomersTable
      initialCustomers={toDTO<CustomerWithCounts[]>(customers)}
      focusId={focusId}
    />
  );
}
