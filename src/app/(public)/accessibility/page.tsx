import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Accessibility Statement",
  description:
    "Golden Rule Air Conditioning & Heating is committed to a website that everyone can use — keyboard navigable, reduced-motion friendly, and WCAG-conscious.",
  alternates: { canonical: "/accessibility" },
};

export default function AccessibilityPage() {
  return (
    <>
      <PageHero
        eyebrow="For Everyone"
        title="Accessibility Statement"
        intro="Treating people the way we would want to be treated includes everyone who visits this website."
        compact
      />

      <section className="bg-white py-14 sm:py-16">
        <div className="container-site max-w-3xl">
          <div className="prose-site">
            <h2>Our commitment</h2>
            <p>
              {COMPANY.name} wants every visitor to be able to find our
              services, read our content, and contact us without barriers. We
              aim to follow the Web Content Accessibility Guidelines (WCAG) as
              we build and maintain this site, and we treat accessibility as an
              ongoing effort rather than a one-time checkbox.
            </p>

            <h2>What we do</h2>
            <ul>
              <li>
                <strong>Semantic structure:</strong> pages use meaningful
                headings, landmarks, and labels so screen readers can navigate
                them.
              </li>
              <li>
                <strong>Keyboard navigability:</strong> menus, forms, and
                interactive controls are designed to work without a mouse, with
                visible focus states.
              </li>
              <li>
                <strong>Reduced motion:</strong> animations respect your
                operating system&rsquo;s &ldquo;reduce motion&rdquo; preference
                and are kept subtle for everyone else.
              </li>
              <li>
                <strong>Forms that explain themselves:</strong> every field has
                a label, errors are announced to assistive technology, and
                required fields are marked.
              </li>
              <li>
                <strong>Readable by design:</strong> we pay attention to color
                contrast, text sizing, and layouts that adapt to any screen.
              </li>
            </ul>

            <h2>Known limitations</h2>
            <p>
              Some embedded third-party content (such as videos and maps) is
              provided by outside services, and its accessibility depends on
              those providers. If an embed gives you trouble, contact us by
              phone and we will help you directly.
            </p>

            <h2>Tell us how we can do better</h2>
            <p>
              If any part of this site is difficult for you to use, we want to
              know — and we are happy to assist you over the phone with anything
              the website provides, from requesting service to asking about our
              guarantees.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-line bg-paper p-6">
            <p className="text-sm leading-relaxed text-body">
              Report an accessibility issue or get help by phone:{" "}
              <PhoneLink
                className="font-semibold text-ink underline-offset-4 hover:underline"
                label="accessibility-page"
              >
                {COMPANY.phoneVanity}
              </PhoneLink>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
