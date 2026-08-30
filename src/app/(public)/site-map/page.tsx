import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import {
  RESIDENTIAL_LINKS,
  COMMERCIAL_LINKS,
  PROGRAM_LINKS,
  COMPANY_LINKS,
  RESOURCE_LINKS,
  AREA_LINKS,
} from "@/lib/nav-data";

export const metadata: Metadata = {
  title: "Site Map",
  description:
    "Every page on the Golden Rule Air Conditioning & Heating website, organized in one place — services, programs, company info, resources, and service areas.",
  alternates: { canonical: "/site-map" },
};

type NavLink = { name: string; href: string };

const GROUPS: { heading: string; links: NavLink[] }[] = [
  {
    heading: "Get Started",
    links: [
      { name: "Home", href: "/" },
      { name: "Request Service", href: "/request-service" },
      { name: "Request an Estimate", href: "/request-estimate" },
    ],
  },
  {
    heading: "Residential",
    links: [{ name: "Residential Overview", href: "/residential" }, ...RESIDENTIAL_LINKS],
  },
  {
    heading: "Commercial & New Construction",
    links: [
      { name: "Commercial Overview", href: "/commercial" },
      ...COMMERCIAL_LINKS,
      { name: "New Construction", href: "/new-construction" },
    ],
  },
  {
    heading: "Programs & Savings",
    links: PROGRAM_LINKS,
  },
  {
    heading: "Company",
    links: COMPANY_LINKS,
  },
  {
    heading: "Resources",
    links: RESOURCE_LINKS,
  },
  {
    heading: "Service Areas",
    links: [{ name: "All Service Areas", href: "/service-areas" }, ...AREA_LINKS],
  },
  {
    heading: "Legal & Site",
    links: [
      { name: "Privacy Policy", href: "/privacy-policy" },
      { name: "Terms of Use", href: "/terms" },
      { name: "Accessibility Statement", href: "/accessibility" },
      { name: "Site Map", href: "/site-map" },
    ],
  },
];

export default function SiteMapPage() {
  return (
    <>
      <PageHero
        eyebrow="Everything In One Place"
        title="Site Map"
        intro="Every page on our website, organized so you can jump straight to what you need."
        compact
      />

      <section className="bg-white py-14 sm:py-16">
        <div className="container-site">
          <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {GROUPS.map((group) => (
              <nav key={group.heading} aria-label={group.heading}>
                <h2 className="eyebrow border-b border-line pb-3">{group.heading}</h2>
                <ul className="mt-4 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={`${group.heading}-${link.href}-${link.name}`}>
                      <Link
                        href={link.href}
                        className="text-[15px] font-medium text-body underline-offset-4 transition-colors hover:text-ink hover:underline"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
