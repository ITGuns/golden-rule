/**
 * Server-only page guard for admin CMS routes.
 * Do NOT import from client components — pulls in "@/lib/auth" (cookies, db).
 */
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requireSession, type SessionUser } from "@/lib/auth";
import { roleLabel } from "./shared";

/**
 * Page-level session gate. Redirects to the login screen when signed out;
 * returns null on a role mismatch so the page can render <AccessDenied />.
 */
export async function requirePageSession(roles: string[]): Promise<SessionUser | null> {
  try {
    return await requireSession(roles);
  } catch (e) {
    if (e instanceof Response) {
      if (e.status === 401) redirect("/admin/login");
      return null; // 403 — wrong role
    }
    throw e;
  }
}

/** Friendly 403 panel for signed-in users without the required role. */
export function AccessDenied({ roles }: { roles: string[] }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="max-w-md rounded-2xl border border-line bg-white p-8 text-center shadow-[0_1px_3px_rgb(0_0_0/0.06)] dark:border-night-line dark:bg-night-soft">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep dark:text-gold">
          <ShieldAlert className="size-6" aria-hidden />
        </div>
        <h1 className="font-display text-lg font-semibold text-ink dark:text-white">
          You don&rsquo;t have access to this page
        </h1>
        <p className="mt-2 text-sm text-muted dark:text-gray-400">
          This area is limited to: {roles.map(roleLabel).join(", ")}. Ask an administrator to
          update your role if you need access.
        </p>
      </div>
    </div>
  );
}
