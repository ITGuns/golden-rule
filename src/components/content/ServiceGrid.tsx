import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { StaggerGroup, StaggerItem } from "@/components/motion/Reveal";

export type ServiceGridItem = {
  slug: string;
  name: string;
  excerpt: string;
  heroImage: string | null;
};

/**
 * Division landing grid of service cards. Handles the empty state so every
 * caller stays honest when the database has no published rows yet.
 */
export function ServiceGrid({
  services,
  basePath,
  emptyLabel,
}: {
  services: ServiceGridItem[];
  basePath: string;
  emptyLabel: string;
}) {
  if (services.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-line bg-paper p-12 text-center">
        <p className="font-display text-lg font-bold text-ink">{emptyLabel}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Our full service list is being published. In the meantime, call us and a
          real person will point you in the right direction.
        </p>
        <PhoneLink
          label={`empty-services:${basePath}`}
          className="mt-5 font-display text-xl font-bold text-ink transition-colors hover:text-gold-deep"
        />
      </div>
    );
  }

  return (
    <StaggerGroup className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((s) => (
        <StaggerItem key={s.slug} className="h-full">
          <Link
            href={`${basePath}/${s.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lift"
          >
            <div className="relative h-48 overflow-hidden bg-paper">
              {s.heroImage && (
                <Image
                  src={s.heroImage}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              )}
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="font-display text-xl font-bold text-ink transition-colors group-hover:text-gold-deep">
                {s.name}
              </h3>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{s.excerpt}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-gold-deep">
                Explore {s.name.toLowerCase()}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </span>
            </div>
          </Link>
        </StaggerItem>
      ))}
    </StaggerGroup>
  );
}
