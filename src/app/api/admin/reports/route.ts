import type { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { buildReport, isReportType, resolveRange } from "@/lib/admin-stats";

/**
 * GET /api/admin/reports?type=&from=&to=&format=csv
 * Builds report rows per type; format=csv streams a text/csv attachment,
 * otherwise returns JSON { type, title, columns, rows }.
 */

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(columns: string[], rows: (string | number)[][]): string {
  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) lines.push(row.map(csvCell).join(","));
  return lines.join("\r\n") + "\r\n";
}

function fileStamp(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  try {
    await requireSession();
    const params = req.nextUrl.searchParams;
    const typeRaw = params.get("type") || "lead";
    if (!isReportType(typeRaw)) {
      return Response.json({ error: "Unknown report type" }, { status: 400 });
    }
    const { from, to } = resolveRange({
      range: params.get("range") || undefined,
      from: params.get("from") || undefined,
      to: params.get("to") || undefined,
    });

    const report = await buildReport(typeRaw, from, to);

    if (params.get("format") === "csv") {
      const csv = toCsv(report.columns, report.rows);
      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${typeRaw}-report-${fileStamp(
            from
          )}-to-${fileStamp(to)}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    return Response.json(report);
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to build report" }, { status: 500 });
  }
}
