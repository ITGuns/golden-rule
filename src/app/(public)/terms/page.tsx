import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of use for the Golden Rule Air Conditioning & Heating website, including acceptable use, intellectual property, and informational-content disclaimers.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Terms of Use"
        intro="These terms govern your use of this website. By using the site, you agree to them."
        compact
      />

      <section className="bg-white py-14 sm:py-16">
        <div className="container-site max-w-3xl">
          <div className="prose-site">
            <h2>Use of this website</h2>
            <p>
              This website is provided by {COMPANY.name} so you can learn about
              our services, request service or an estimate, and get in touch
              with our team. You agree to use the site only for lawful purposes
              and not to interfere with its operation, attempt to gain
              unauthorized access to any part of it, or submit false or
              misleading information through our forms.
            </p>

            <h2>Informational content</h2>
            <p>
              Articles, guides, and other content on this site are provided for
              general informational purposes only and are offered without
              warranty of any kind. They are not a substitute for an on-site
              diagnosis of your specific equipment. For advice about your own
              system, please contact us by phone so a qualified team member can
              help.
            </p>
            <p>
              Any work we perform for you is governed by the written agreement
              or invoice for that work — nothing on this website creates a
              service contract or modifies the terms of one.
            </p>

            <h2>Intellectual property</h2>
            <p>
              The content of this site — including text, graphics, logos, and
              the Golden Rule name and marks such as GoldStandard™, DARE™, and
              GoldCertified™ — belongs to {COMPANY.name} or its licensors. You
              may not reproduce or use it for commercial purposes without our
              permission.
            </p>

            <h2>Third-party links and embeds</h2>
            <p>
              This site may include links to, or embedded content from, third
              party sites (for example, video and map embeds). We are not
              responsible for the content or privacy practices of those sites.
            </p>

            <h2>Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, {COMPANY.name} is not
              liable for any damages arising from your use of, or inability to
              use, this website or its content.
            </p>

            <h2>Changes to these terms</h2>
            <p>
              We may update these terms from time to time. Updates will be
              posted on this page, and your continued use of the site after an
              update means you accept the revised terms.
            </p>

            <h2>Contact</h2>
            <p>
              Questions about these terms? Call us at{" "}
              <PhoneLink
                className="font-semibold text-ink underline-offset-4 hover:underline"
                showIcon={false}
                label="terms-page"
              />
              . {COMPANY.name}, {COMPANY.address.street},{" "}
              {COMPANY.address.city}, {COMPANY.address.state}{" "}
              {COMPANY.address.zip}. Texas License {COMPANY.license}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
