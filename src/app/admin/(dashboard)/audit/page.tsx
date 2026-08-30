import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ScrollText, ShieldAlert } from "lucide-react";
import { db } from "@/lib/db";
import { getSession, ADMIN_ROLES } from "@/lib/auth";
import { cn, formatDateTime } from "@/lib/utils";
import { Badge, Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/admin/EmptyState";

export const metadata: Metadata = {
  title: "Audit Log",
  alternates: { canonical: "/admin/audit" },
};

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

function actionTone(action: string): "neutral" | "gold" | "green" | "red" | "blue" {
  const a = action.toUpperCase();
  if (a.includes("DELETE")) return "red";
  if (a.includes("CREATE")) return "green";
  if (a.includes("UPDATE") || a.includes("STATUS")) return "gold";
  if (a.includes("LOGIN") || a.includes("LOGOUT")) return "blue";
  return "neutral";
}

function snippet(json: string | null, max = 70): string | null {
  if (!json) return null;
  let text = json;
  try {
    const parsed: unknown = JSON.parse(json);
    text = typeof parsed === "string" ? parsed : JSON.stringify(parsed);
  } catch {
    // keep raw text
  }
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export default async function AuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getSession();
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Administrator access required"
        hint="The audit log is only visible to Super Admin and Admin roles."
      />
    );
  }

  const sp = await searchParams;
  const pageRaw = Number.parseInt(
    (Array.isArray(sp.page) ? sp.page[0] : sp.page) || "1",
    10
  );
  const page = Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw;
  const entity = ((Array.isArray(sp.entity) ? sp.entity[0] : sp.entity) || "").trim();

  const where = entity ? { entity } : {};
  const [rows, total, entities] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      distinct: ["entity"],
      select: { entity: true },
      orderBy: { entity: "asc" },
    }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function pageHref(p: number) {
    const qs = new URLSearchParams();
    if (entity) qs.set("entity", entity);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return `/admin/audit${s ? `?${s}` : ""}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink dark:text-white">
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-muted dark:text-gray-400">
          Every admin action, with who did it and what changed.
        </p>
      </div>

      {/* entity filter */}
      <div role="group" aria-label="Filter by entity" className="flex flex-wrap gap-2">
        <Link
          href="/admin/audit"
          aria-current={!entity ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
            !entity
              ? "bg-ink text-white dark:bg-gold dark:text-ink"
              : "border border-line text-body hover:bg-black/5 hover:text-ink dark:border-night-line dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
          )}
        >
          All
        </Link>
        {entities.map((e) => (
          <Link
            key={e.entity}
            href={`/admin/audit?entity=${encodeURIComponent(e.entity)}`}
            aria-current={entity === e.entity ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
              entity === e.entity
                ? "bg-ink text-white dark:bg-gold dark:text-ink"
                : "border border-line text-body hover:bg-black/5 hover:text-ink dark:border-night-line dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
            )}
          >
            {e.entity}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={entity ? `No audit entries for ${entity}` : "No audit entries yet"}
          hint="Logins and record changes made in the admin will appear here automatically."
        />
      ) : (
        <Card className="p-5">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted dark:border-night-line dark:text-gray-400">
                  <th scope="col" className="py-2 pr-4 font-semibold">When</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">User</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Action</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Entity</th>
                  <th scope="col" className="py-2 pr-4 font-semibold">Record</th>
                  <th scope="col" className="py-2 font-semibold">Change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const oldSnip = snippet(row.oldValue);
                  const newSnip = snippet(row.newValue);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-line/70 align-top transition-colors hover:bg-black/[0.025] dark:border-night-line/70 dark:hover:bg-white/5"
                    >
                      <td className="whitespace-nowrap py-2.5 pr-4 text-muted dark:text-gray-400">
                        {formatDateTime(row.createdAt)}
                      </td>
                      <td className="py-2.5 pr-4 font-semibold text-ink dark:text-white">
                        {row.user?.name || "System"}
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge tone={actionTone(row.action)}>{row.action}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-body dark:text-gray-300">{row.entity}</td>
                      <td className="max-w-32 truncate py-2.5 pr-4 font-mono text-xs text-muted dark:text-gray-400">
                        {row.entityId || "—"}
                      </td>
                      <td className="max-w-sm py-2.5 font-mono text-xs text-body dark:text-gray-300">
                        {oldSnip || newSnip ? (
                          <span className="break-all">
                            {oldSnip && (
                              <span className="text-danger/80 line-through decoration-danger/40 dark:text-red-400/80">
                                {oldSnip}
                              </span>
                            )}
                            {oldSnip && newSnip && <span aria-hidden> → </span>}
                            {newSnip && (
                              <span className="text-success dark:text-green-400">{newSnip}</span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* pagination */}
          <nav
            aria-label="Audit log pagination"
            className="mt-4 flex items-center justify-between border-t border-line pt-4 dark:border-night-line"
          >
            <p className="text-xs text-muted dark:text-gray-400">
              Page {page} of {pageCount} — {total.toLocaleString("en-US")} entries
            </p>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={pageHref(page - 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-body transition-colors hover:bg-black/5 hover:text-ink dark:border-night-line dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <ChevronLeft className="size-4" aria-hidden /> Newer
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-muted opacity-50 dark:border-night-line dark:text-gray-500"
                >
                  <ChevronLeft className="size-4" aria-hidden /> Newer
                </span>
              )}
              {page < pageCount ? (
                <Link
                  href={pageHref(page + 1)}
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-body transition-colors hover:bg-black/5 hover:text-ink dark:border-night-line dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  Older <ChevronRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="inline-flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-muted opacity-50 dark:border-night-line dark:text-gray-500"
                >
                  Older <ChevronRight className="size-4" aria-hidden />
                </span>
              )}
            </div>
          </nav>
        </Card>
      )}
    </div>
  );
}
