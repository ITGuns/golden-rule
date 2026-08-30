"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { COMPANY } from "@/lib/site";
import { ADMIN_NAV_SECTIONS } from "./nav";

/**
 * Fixed admin sidebar. Always visible ≥lg; slides in behind the topbar menu
 * button on smaller screens.
 */
export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        aria-label="Admin navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-white transition-transform duration-300 dark:border-night-line dark:bg-night-soft lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-line px-4 dark:border-night-line">
          <Link
            href="/admin"
            className="flex items-center rounded-lg dark:bg-white/95 dark:px-2 dark:py-1"
            onClick={onClose}
          >
            <Image
              src="/brand/GOL_Logo-RGB-2.png"
              alt={`${COMPANY.shortName} admin dashboard`}
              width={140}
              height={46}
              priority
              className="h-8 w-auto"
            />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-lg p-1.5 text-muted hover:bg-black/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {ADMIN_NAV_SECTIONS.map((section) => (
            <div key={section.title} className="mb-5">
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted dark:text-gray-500">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-gold/15 font-semibold text-ink dark:bg-gold/15 dark:text-white"
                            : "text-body hover:bg-black/5 hover:text-ink dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4.5 shrink-0",
                            active
                              ? "text-gold-deep dark:text-gold"
                              : "text-muted group-hover:text-ink dark:text-gray-500 dark:group-hover:text-white"
                          )}
                          aria-hidden
                        />
                        {item.label}
                        {active && (
                          <span
                            className="ml-auto size-1.5 rounded-full bg-gold"
                            aria-hidden
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-line px-4 py-3 dark:border-night-line">
          <p className="text-xs font-semibold text-ink dark:text-white">
            {COMPANY.shortName} Admin
          </p>
          <p className="text-[11px] text-muted dark:text-gray-500">
            License {COMPANY.license}
          </p>
        </div>
      </aside>
    </>
  );
}
