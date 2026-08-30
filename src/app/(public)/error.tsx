"use client";

import { useEffect } from "react";
import { COMPANY } from "@/lib/site";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 pt-[72px] text-center">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="display mt-3 text-3xl sm:text-4xl">We hit an unexpected snag.</h1>
      <p className="mt-3 max-w-md text-muted">
        Try again — and if it keeps happening, we&apos;re a phone call away at{" "}
        <a href={COMPANY.phoneHref} className="font-bold text-gold-deep">
          {COMPANY.phone}
        </a>
        .
      </p>
      <button
        onClick={reset}
        className="mt-7 rounded-xl border-2 border-ink bg-gold px-6 py-3 font-display font-bold text-ink"
      >
        Try again
      </button>
    </div>
  );
}
