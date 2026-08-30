import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileCTABar } from "@/components/layout/MobileCTABar";
import { ChatWidget } from "@/components/chat/ChatWidget";
import { COMPANY, SITE_URL } from "@/lib/site";

/** LocalBusiness / HVACBusiness structured data on every public page. */
function BusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HVACBusiness",
    name: COMPANY.name,
    url: SITE_URL,
    telephone: "+12815007874",
    foundingDate: String(COMPANY.founded),
    logo: `${SITE_URL}/brand/LOGO-PLAIN-no-tagline-BEST-ONE-1.png`,
    image: `${SITE_URL}/brand/GOL_Logo-RGB-2.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.address.street,
      addressLocality: COMPANY.address.city,
      addressRegion: COMPANY.address.state,
      postalCode: COMPANY.address.zip,
      addressCountry: "US",
    },
    areaServed: ["Houston TX", "Cypress TX", "Spring TX", "Tomball TX", "Katy TX", "Sugar Land TX"],
    sameAs: [
      "https://www.facebook.com/thegoldenrulecomfort",
      "https://www.instagram.com/goldenrulecomfort/",
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BusinessJsonLd />
      <Header />
      <main id="main" className="min-h-screen pb-16 lg:pb-0">
        {children}
      </main>
      <Footer />
      <MobileCTABar />
      <ChatWidget />
    </>
  );
}
