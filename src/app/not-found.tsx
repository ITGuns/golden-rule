import Link from "next/link";
import { COMPANY } from "@/lib/site";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-night px-6 text-center">
      <p className="eyebrow">404</p>
      <h1 className="display mt-4 text-4xl !text-white sm:text-5xl">
        This page lost its cool.
      </h1>
      <p className="mt-4 max-w-md text-white/60">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back
        to comfort.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="rounded-xl border-2 border-ink bg-gold px-6 py-3 font-display font-bold text-ink"
        >
          Back to Home
        </Link>
        <Link
          href="/request-service"
          className="rounded-xl border-2 border-white/40 px-6 py-3 font-display font-bold text-white hover:border-gold hover:text-gold"
        >
          Request Service
        </Link>
      </div>
      <a href={COMPANY.phoneHref} className="mt-6 text-sm text-white/50 hover:text-gold">
        Or call us: {COMPANY.phone}
      </a>
    </div>
  );
}
