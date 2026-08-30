import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { Reveal } from "@/components/motion/Reveal";
import { COMPANY } from "@/lib/site";
import { CareerForm } from "./CareerForm";

export const metadata: Metadata = {
  title: "Careers",
  description:
    "We are hiring! Join Golden Rule Air Conditioning & Heating, a full-service HVAC mechanical contractor in Houston, TX committed to the Golden Rule.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow="Careers"
        title="We Are Hiring!"
        intro="Golden Rule Air Conditioning & Heating is a full-service air conditioning and heating mechanical contractor operating out of Houston, Texas."
      />

      {/* Culture */}
      <section className="bg-white py-16 sm:py-20" aria-labelledby="culture-heading">
        <div className="container-site max-w-3xl">
          <Reveal>
            <p className="eyebrow">Who We Are</p>
            <h2 id="culture-heading" className="display mt-3 text-3xl sm:text-4xl">
              A team that lives the Golden Rule
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-body">
              <p>
                We hold several business- and industry-related certifications and
                memberships, including NATE, BBB, RSES, ACCA, and NCI. Our team
                of engineers, technicians, and service men are prepared to
                professionally represent the Golden Rule brand: a symbol of
                integrity, honesty, and technical proficiency.
              </p>
              <p>
                We strive to honor the name of Jesus Christ in everything that we
                do. Everyone involved is committed to obeying the Golden Rule,
                which is:
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <blockquote className="display mt-8 rounded-2xl border-l-4 border-gold bg-paper p-7 text-xl leading-snug sm:text-2xl">
              {COMPANY.guidingVerse}
            </blockquote>
            <p className="mt-6 text-lg leading-relaxed text-body">
              We endeavor to apply this guiding principle in our dealings with
              our suppliers, our fellow contractors, our own employees, and our
              customers.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Application */}
      <section
        className="border-t border-line bg-paper py-16 sm:py-20"
        aria-labelledby="apply-heading"
      >
        <div className="container-site max-w-3xl">
          <Reveal>
            <p className="eyebrow">Apply Now</p>
            <h2 id="apply-heading" className="display mt-3 text-2xl sm:text-3xl">
              Tell us about yourself
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-muted">
              Fill out the application below and our team will be in touch. If
              you have a resume ready, hold onto it — we can discuss it after
              first contact.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="mt-8">
            <CareerForm />
          </Reveal>
        </div>
      </section>
    </>
  );
}
