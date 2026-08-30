import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Standard page opener under the fixed 72px header.
 * With `image`: dark cinematic band with the photo ghosted behind.
 * Without: warm paper band.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  image,
  children,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  image?: string | null;
  children?: ReactNode;
  compact?: boolean;
}) {
  const dark = Boolean(image);
  return (
    <section
      className={cn(
        "relative overflow-hidden pt-[72px]",
        dark ? "bg-night" : "border-b border-line bg-paper"
      )}
    >
      {image && (
        <>
          <Image
            src={image}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-night via-night/75 to-night/30" />
        </>
      )}
      <div className={cn("container-site relative", compact ? "py-14" : "py-20 sm:py-24")}>
        <p className="eyebrow">{eyebrow}</p>
        <h1
          className={cn(
            "display mt-3 max-w-3xl text-4xl sm:text-5xl",
            dark && "!text-white"
          )}
        >
          {title}
        </h1>
        {intro && (
          <p
            className={cn(
              "mt-4 max-w-2xl text-lg leading-relaxed",
              dark ? "text-white/70" : "text-muted"
            )}
          >
            {intro}
          </p>
        )}
        {children && <div className="mt-7">{children}</div>}
      </div>
    </section>
  );
}
