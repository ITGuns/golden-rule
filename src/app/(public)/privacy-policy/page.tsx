import type { Metadata } from "next";
import { PageHero } from "@/components/layout/PageHero";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { COMPANY } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "We are the sole owners of the information collected on this site. We only collect information that you voluntarily give us, and we never sell or rent it.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        eyebrow="Legal"
        title="Privacy Policy"
        intro="This privacy policy discloses the privacy practices for this website and applies solely to information collected by this site."
        compact
      />

      <section className="bg-white py-14 sm:py-16">
        <div className="container-site max-w-3xl">
          <div className="prose-site">
            <p>This privacy policy will notify you of the following:</p>
            <ul>
              <li>
                What personally identifiable information is collected from you
                through the website, how it is used, and with whom it may be
                shared.
              </li>
              <li>
                What choices are available to you regarding the use of your
                data.
              </li>
              <li>
                The security procedures in place to protect against the misuse
                of your information.
              </li>
              <li>How you can correct any inaccuracies in the information.</li>
            </ul>

            <h2>Information collection, use, and sharing</h2>
            <p>
              We are the sole owners of the information collected on this site.
              We only have access to and collect information that you
              voluntarily give us via our forms, by phone, or through other
              direct contact from you. We will not sell or rent this
              information to anyone.
            </p>
            <p>
              We will use your information to respond to you regarding the
              reason you contacted us. We will not share your information with
              any third party outside of our organization, other than as
              necessary to fulfill your request. Unless you ask us not to, we
              may contact you in the future to tell you about new products or
              services, or changes to this privacy policy.
            </p>
            <p>
              Our site logs do generate certain kinds of non-identifying site
              usage data, such as the number of visits to our site. This
              information is used for internal purposes by technical support
              staff to provide better services to the public. These statistics
              contain no personal information and cannot be used to gather such
              information.
            </p>

            <h2>Your access to and control over information</h2>
            <p>
              You may opt out of any future contacts from us at any time. You
              can do the following at any time by calling the phone number given
              on our website:
            </p>
            <ul>
              <li>See what data we have about you, if any</li>
              <li>Change or correct any data we have about you</li>
              <li>Have us delete any data we have about you</li>
              <li>Express any concern you have about our use of your data</li>
            </ul>

            <h2>Cookies</h2>
            <p>
              We use &ldquo;cookies&rdquo; on this site. A cookie is a piece of
              data stored on a site visitor&rsquo;s hard drive to help us improve
              your access to our site and identify repeat visitors. Cookies can
              also enable us to track and target the interests of our users to
              enhance the experience on our site. Usage of a cookie is in no way
              linked to any personally identifiable information on our site.
            </p>

            <h2>Security</h2>
            <p>
              We take precautions to protect your information. When you submit
              sensitive information via the website, your information is
              protected both online and offline.
            </p>
            <p>
              While we use encryption to protect sensitive information
              transmitted online, we also protect your information offline. Only
              employees who need the information to perform a specific job (for
              example, customer service) are granted access to
              personally-identifiable information. The computers and servers on
              which we store personally-identifiable information are kept in a
              secure environment.
            </p>

            <h2>Updates</h2>
            <p>
              Our privacy policy may change from time to time, and all updates
              will be posted on this page. If you feel that we are not abiding
              by this privacy policy, please contact us immediately.
            </p>
          </div>

          <div className="mt-10 rounded-2xl border border-line bg-paper p-6">
            <p className="text-sm leading-relaxed text-body">
              Questions about this policy? Call {COMPANY.name} at{" "}
              <PhoneLink
                className="font-semibold text-ink underline-offset-4 hover:underline"
                showIcon={false}
                label="privacy-policy"
              />
              . {COMPANY.address.street}, {COMPANY.address.city},{" "}
              {COMPANY.address.state} {COMPANY.address.zip}.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
