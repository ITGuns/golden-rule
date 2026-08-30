import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Referral Program",
  description:
    "Our GoldNugget Referral Program pays. Refer a friend for a new GoldCertified™ Comfort System installation and receive a $150 referral gift.",
  alternates: { canonical: "/referral-program" },
};

export default function ReferralProgramPage() {
  return (
    <>
      <PageHero
        eyebrow="GoldNugget Referral Program"
        title="Refer a Friend — Reward Program"
        intro="A gift of appreciation: you get $150, your friend gets a great system."
      />

      {/* How it works */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal direction="right">
            <p className="eyebrow">Our GoldNugget Referral Program Pays</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              You get $150. Your friend gets a great system.
            </h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-body">
              <p>
                When you refer a friend to Golden Rule Air Conditioning &amp;
                Heating for a new GoldCertified™ Comfort System installation,
                you will receive a $150 referral gift.
              </p>
              <p>
                Referrals for complete GoldCertified™ Comfort Systems are paid
                as a check directly to the name of the person who did the
                referring. Referral fees are paid within 60 days upon
                installation and completion of funding.
              </p>
            </div>
          </Reveal>
          <Reveal direction="left">
            <Card className="border-2 border-gold p-8 text-center shadow-gold sm:p-10">
              <p className="eyebrow">Gift of Appreciation</p>
              <p className="display mt-4 text-7xl font-bold text-ink">$150</p>
              <p className="display mt-3 text-lg tracking-wide">
                GoldCertified™ Complete A/C System Installation
              </p>
              <p className="mt-4 text-sm italic leading-relaxed text-muted">
                A complete system includes the outdoor unit and indoor units.
              </p>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-paper py-16" aria-labelledby="referral-cta">
        <div className="container-site max-w-3xl text-center">
          <Reveal>
            <p className="eyebrow">Know Someone Who Needs a New System?</p>
            <h2 id="referral-cta" className="display mt-3 text-2xl sm:text-3xl">
              Send them our way — we&rsquo;ll take it from there
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-relaxed text-muted">
              Call our office to make a referral, or have your friend request an
              estimate and mention your name.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <PhoneLink
                className="rounded-xl border-2 border-ink bg-gold px-7 py-3.5 text-base font-bold text-ink shadow-[0_5px_14px_rgb(0_0_0/0.25)] transition-all hover:bg-gold-deep"
                label="referral-page"
              >
                Call 281-500-7874
              </PhoneLink>
              <ButtonLink href="/request-estimate" variant="outline" size="lg">
                Request an Estimate
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
