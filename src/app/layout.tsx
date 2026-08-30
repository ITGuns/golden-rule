import type { Metadata, Viewport } from "next";
import { Lato, Space_Grotesk } from "next/font/google";
import { COMPANY, SITE_URL } from "@/lib/site";
import "./globals.css";

const lato = Lato({
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  variable: "--font-lato",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${COMPANY.name} | Houston HVAC — Air Conditioning, Heating, Repair`,
    template: `%s | ${COMPANY.name}`,
  },
  description:
    "Full-service Houston HVAC mechanical contractor since 2007. Residential, commercial, and new construction air conditioning, heating, and maintenance. Call 281-500-RUSH.",
  icons: {
    icon: [
      { url: "/brand/cropped-favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/cropped-favicon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/brand/cropped-favicon-180x180.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    siteName: COMPANY.name,
    locale: "en_US",
    type: "website",
    images: [{ url: "/brand/GOL_Logo-RGB-2.png", width: 782, height: 258 }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#fccd35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${lato.variable} ${grotesk.variable}`}>
      <body>{children}</body>
    </html>
  );
}
