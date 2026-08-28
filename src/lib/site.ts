/**
 * Single source of truth for verified Golden Rule business facts.
 * Everything here was confirmed from the live goldenrulecomfort.com site —
 * do not add claims, stats, or certifications that are not on the source site.
 */

export const COMPANY = {
  name: "Golden Rule Air Conditioning & Heating",
  shortName: "Golden Rule",
  legalFooter: "Golden Rule Air Conditioning & Heating",
  tagline:
    "A full-service air conditioning and heating mechanical contractor, with three divisions to serve you: Residential, Commercial, and New Construction.",
  founded: 2007,
  phone: "281-500-7874",
  phoneVanity: "281-500-RUSH (7874)",
  phoneHref: "tel:+12815007874",
  emergencyNote: "Emergency Service Available",
  address: {
    street: "9306 Thomasville Dr.",
    city: "Houston",
    state: "TX",
    zip: "77064",
  },
  license: "TACLA27294C",
  guidingVerse:
    "“So in everything, do to others what you would have them do to you, for this sums up the Law and the Prophets.” — Matthew 7:12",
  missionNote:
    "We strive to honor the name of Jesus Christ in everything that we do. Everyone involved is committed to obeying the Golden Rule.",
} as const;

export const SOCIALS = [
  { name: "Facebook", url: "https://www.facebook.com/thegoldenrulecomfort" },
  { name: "Instagram", url: "https://www.instagram.com/goldenrulecomfort/" },
  { name: "X", url: "https://x.com/GoldenR90900119" },
  {
    name: "LinkedIn",
    url: "https://www.linkedin.com/company/golden-rule-air-conditioning-%26-heating/about/",
  },
] as const;

/** Industry certifications & memberships confirmed on the live site. */
export const CERTIFICATIONS = [
  { key: "NATE", label: "NATE Certified", image: "/images/nate.png" },
  { key: "BBB", label: "Better Business Bureau", image: "/images/bbb-logo.png" },
  { key: "RSES", label: "RSES", image: "/images/homeLogo.gif" },
  { key: "ACCA", label: "ACCA", image: null },
  { key: "NCI", label: "National Comfort Institute", image: "/images/landingpageinset1.jpg" },
  { key: "TACCA", label: "TACCA", image: "/images/logo-new.jpg" },
] as const;

/** Equipment brands shown on the live /products/ page. */
export const BRANDS = [
  { name: "American Standard", logo: "/images/american-standard-square.webp" },
  { name: "Bryant", logo: "/images/bryant-square.webp" },
  { name: "Daikin", logo: "/images/daikin-square.webp" },
  { name: "Lennox", logo: "/images/lennox-logo.webp" },
  { name: "Mitsubishi Electric", logo: "/images/mitsubishi-logo-square.webp" },
  { name: "Ruud", logo: "/images/ruud-logo.webp" },
  { name: "Trane", logo: "/images/trane-logo-1.webp" },
  { name: "York", logo: "/images/York-Heating.webp" },
] as const;

/** The five Gold Plated Guarantees, verbatim from the live site. */
export const GUARANTEES = [
  {
    title: "Best Price Guarantee",
    icon: "/images/gte_best-price.webp",
    body: "You can find cheaper heating and cooling companies, but you will not find a better installation for the price. We believe that a DARE™ installation is the ONLY way you can get the comfort and efficiency you paid for. So we guarantee that if you get a published quote that has all the features of DARE™, we will match the price plus we will give you $50.",
  },
  {
    title: "Critical Component Guarantee",
    icon: "/images/gte_critical-component.webp",
    body: "The compressor in your outside unit and the heat exchanger in your furnace are the most important parts and critical to the safe operation of your system. If the compressor fails in the first five years or the heat exchanger fails in the first 10 years, we agree to change out the entire unit (condenser or furnace) and not just the failed part.",
  },
  {
    title: "100% Money Back Satisfaction Guarantee",
    icon: "/images/gte_satisfaction.webp",
    body: "Our customer's satisfaction is more important than anything we do. If, for any reason, you are not 100 percent satisfied with the performance of the equipment or our services, we will correct the system within the first two years. If we cannot correct the problem within this time, we agree to remove the system and refund your money.",
  },
  {
    title: "Polite Installers Guarantee",
    icon: "/images/gte_polite-installer.webp",
    body: "Our technicians obey the Golden Rule (Mat 7:12). They will never swear, smoke, or do anything in your home that is not consistent with Christian character. They will be polite and courteous and will strive to leave your home cleaner than when they arrived.",
  },
  {
    title: "24-Hour Hotel Guarantee",
    icon: "/images/gte_24hr-hotel.webp",
    body: "We are so confident that your new GoldCertified™ Comfort System will be trouble free, that if you do have a problem, we will agree to pay for your hotel room (up to $75) if your system is not up and running within 24 hours of when we arrive to fix it.",
  },
] as const;

/** Videos embedded on the live site (re-embedded, never rehosted). */
export const VIDEOS = {
  homepage: "weJ-rc6kxus",
  specials: "SUcHVuMEm7A",
  savingsArticle: "Wf4cea5oObY",
} as const;

export const SERVICE_CITIES = [
  { slug: "houston-tx", city: "Houston" },
  { slug: "cypress-tx", city: "Cypress" },
  { slug: "spring-tx", city: "Spring" },
  { slug: "tomball-tx", city: "Tomball" },
  { slug: "katy-tx", city: "Katy" },
  { slug: "sugar-land-tx", city: "Sugar Land" },
] as const;

export const DIVISIONS = {
  RESIDENTIAL: {
    label: "Residential",
    href: "/residential",
    blurb:
      "We install, maintain, service, and repair a wide variety of residential HVAC equipment and related components. We have access to all major brands so we can recommend the best fit for your home.",
    icon: "/images/GOL-residential.svg",
    image: "/images/air_conditioner_1024x576.jpg",
  },
  COMMERCIAL: {
    label: "Commercial",
    href: "/commercial",
    blurb:
      "We listen, so that we may correctly diagnose your equipment, and recommend the best course of action for all your commercial AC, heating, refrigeration, and kitchen equipment needs and related accessories.",
    icon: "/images/GOL-commercial.svg",
    image: "/images/commercial_ac_1024x576.jpg",
  },
  NEW_CONSTRUCTION: {
    label: "New Construction",
    href: "/new-construction",
    blurb:
      "A properly installed HVAC system is the lifeblood of a building, keeping you, your customers, employees, and residents safe and healthy. Please view our list of new construction services and past projects.",
    icon: "/images/GOL-new_construction.svg",
    image: "/images/new_construction_1024x576.jpg",
  },
} as const;

export type DivisionKey = keyof typeof DIVISIONS;

export const SERVICE_TYPES = [
  "AC Repair",
  "AC Installation",
  "Heating",
  "Maintenance",
  "Air Duct",
  "Indoor Air Quality",
  "Heat Pump",
  "Commercial",
  "New Construction",
  "Other",
] as const;

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
