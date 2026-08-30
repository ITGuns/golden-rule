import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { YouTubeEmbed } from "@/components/layout/Embeds";
import { Reveal, StaggerGroup, StaggerItem } from "@/components/motion/Reveal";
import { COMPANY, VIDEOS } from "@/lib/site";
import { BadgePercent, Gift, Landmark } from "lucide-react";

export const metadata: Metadata = {
  title: "Specials & Coupons",
  description:
    "Current Golden Rule specials and coupons are announced by our office. Call 281-500-RUSH to hear what is available, or explore financing and referral rewards.",
  alternates: { canonical: "/specials" },
};

export default function SpecialsPage() {
  return (
    <>
      <PageHero
        eyebrow="Offers"
        title="Specials & Coupons"
        intro="Our current specials are announced by the office as they run. Call us to hear what is available right now for your home or business."
      />

      {/* Video + current specials */}
      <section className="bg-white py-16 sm:py-20">
        <div className="container-site grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <Reveal direction="right">
            <YouTubeEmbed
              id={VIDEOS.specials}
              title="Golden Rule Air Conditioning & Heating specials video"
            />
          </Reveal>
          <Reveal direction="left">
            <p className="eyebrow">What&rsquo;s Running Now</p>
            <h2 className="display mt-3 text-3xl sm:text-4xl">
              One call tells you everything
            </h2>
            <div className="mt-5 space-y-4 text-lg leading-relaxed text-body">
              <p>
                Specials change throughout the year, so rather than leave an
                outdated coupon on this page, we keep the current offers with our
                office. Give us a quick call and we will tell you exactly what is
                available today.
              </p>
              <p>
                {COMPANY.emergencyNote} — and while you have us on the phone, we
                can answer any service or installation question too.
              </p>
            </div>
            <div className="mt-8">
              <PhoneLink
                className="rounded-xl border-2 border-ink bg-gold px-7 py-3.5 text-base font-bold text-ink shadow-[0_5px_14px_rgb(0_0_0/0.25)] transition-all hover:bg-gold-deep"
                label="specials-page"
              >
                Ask About Specials: 281-500-7874
              </PhoneLink>
            </div>
          </Reveal>
        </div>
      </section>

      {/* More ways to save */}
      <section
        className="border-t border-line bg-paper py-16 sm:py-20"
        aria-labelledby="save-heading"
      >
        <div className="container-site">
          <Reveal className="text-center">
            <p className="eyebrow">More Ways to Save</p>
            <h2 id="save-heading" className="display mt-3 text-2xl sm:text-3xl">
              Savings that never expire
            </h2>
          </Reveal>
          <StaggerGroup className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-3">
            <StaggerItem>
              <Card className="flex h-full flex-col p-7">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold-soft">
                  <Landmark className="size-6 text-ink" aria-hidden />
                </span>
                <h3 className="display mt-5 text-lg">Financing</h3>
                <p className="mt-2 grow text-[15px] leading-relaxed text-body">
                  Financing for your new comfort system is available through
                  Wells Fargo.
                </p>
                <ButtonLink href="/financing" variant="outline" size="sm" className="mt-5 self-start">
                  Explore Financing
                </ButtonLink>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="flex h-full flex-col p-7">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold-soft">
                  <Gift className="size-6 text-ink" aria-hidden />
                </span>
                <h3 className="display mt-5 text-lg">Referral Program</h3>
                <p className="mt-2 grow text-[15px] leading-relaxed text-body">
                  Refer a friend for a new GoldCertified™ Comfort System
                  installation and receive a $150 referral gift.
                </p>
                <ButtonLink
                  href="/referral-program"
                  variant="outline"
                  size="sm"
                  className="mt-5 self-start"
                >
                  Refer a Friend
                </ButtonLink>
              </Card>
            </StaggerItem>
            <StaggerItem>
              <Card className="flex h-full flex-col p-7">
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-gold-soft">
                  <BadgePercent className="size-6 text-ink" aria-hidden />
                </span>
                <h3 className="display mt-5 text-lg">Best Price Guarantee</h3>
                <p className="mt-2 grow text-[15px] leading-relaxed text-body">
                  Bring us a published quote with all the features of DARE™ and
                  we will match the price plus give you $50.
                </p>
                <ButtonLink
                  href="/gold-plated-guarantees"
                  variant="outline"
                  size="sm"
                  className="mt-5 self-start"
                >
                  See the Guarantees
                </ButtonLink>
              </Card>
            </StaggerItem>
          </StaggerGroup>
        </div>
      </section>
    </>
  );
}
