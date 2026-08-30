import { db } from "@/lib/db";
import { CalendarView } from "@/components/admin/crm/CalendarView";
import { toDTO, type AppointmentDTO, type TeamMember } from "@/components/admin/crm/types";

export const metadata = { title: "Appointments" };
export const dynamic = "force-dynamic";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const autoNew = sp?.new === "1";

  // Seed the current month grid (6 weeks starting on the Sunday before the
  // 1st) — the client refetches when the visible range moves.
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  gridStart.setHours(0, 0, 0, 0);
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 42);

  const [appointments, team] = await Promise.all([
    db.appointment.findMany({
      where: { start: { gte: gridStart, lte: gridEnd } },
      include: {
        customer: true,
        technician: { select: { id: true, name: true, role: true, title: true } },
        lead: { select: { id: true, name: true, status: true } },
      },
      orderBy: { start: "asc" },
    }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true, role: true, title: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CalendarView
      initialAppointments={toDTO<AppointmentDTO[]>(appointments)}
      team={toDTO<TeamMember[]>(team)}
      initialDate={now.toISOString()}
      initialFrom={gridStart.toISOString()}
      initialTo={gridEnd.toISOString()}
      autoNew={autoNew}
    />
  );
}
