import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin Dashboard | Golden Rule", template: "%s | Golden Rule Admin" },
  robots: { index: false, follow: false },
};

/**
 * Applies the stored admin theme before paint. Default is dark (the wrapper
 * ships with the `dark` class); the script removes it when the user chose
 * light. Runs as a child of the wrapper so the element exists when it runs.
 */
const THEME_SCRIPT = `try{var r=document.currentScript&&document.currentScript.parentElement;if(r&&localStorage.getItem("gr-admin-theme")==="light"){r.classList.remove("dark")}}catch(e){}`;

export default async function AdminDashboardLayout({ children }: { children: ReactNode }) {
  const user = await getSession();
  if (!user) redirect("/admin/login");

  return (
    <div id="gr-admin" className="dark" suppressHydrationWarning>
      <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      <AdminShell user={user}>{children}</AdminShell>
    </div>
  );
}
