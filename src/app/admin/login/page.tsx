import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { COMPANY } from "@/lib/site";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Login | Golden Rule",
  description: "Sign in to the Golden Rule Air Conditioning & Heating admin dashboard.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/admin/login" },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await getSession();
  if (user) redirect("/admin");

  return (
    <main className="dark flex min-h-screen items-center justify-center bg-night px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-night-line bg-night-soft p-8 shadow-2xl">
          <span className="mx-auto block w-fit rounded-xl bg-white/95 px-3 py-2">
            <Image
              src="/brand/GOL_Logo-RGB-2.png"
              alt={COMPANY.name}
              width={200}
              height={66}
              priority
              className="h-11 w-auto"
            />
          </span>
          <h1 className="mt-6 text-center font-display text-xl font-semibold tracking-tight text-white">
            Admin sign in
          </h1>
          <p className="mt-1 mb-6 text-center text-sm text-gray-400">
            Sign in to manage leads, jobs and content.
          </p>
          <LoginForm />
        </div>
        <p className="mt-4 text-center text-xs text-gray-500">
          Authorized personnel only. License {COMPANY.license}
        </p>
      </div>
    </main>
  );
}
