/**
 * Setting shapes + fallback values shared by the settings page (server) and
 * SettingsPanels (client). Plain module — safe to import from either side.
 * Fallbacks mirror prisma/seed.ts so the panels match a fresh database.
 */

export type CompanySetting = {
  name: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  license: string;
  hours: string;
  emergencyService: boolean;
};

export type MissedCallSetting = {
  enabled: boolean;
  message: string;
  businessHoursOnly: boolean;
  followUpMinutes: number;
};

export type ReviewsSetting = {
  enabled: boolean;
  delayHours: number;
  channel: "SMS" | "EMAIL";
  message: string;
  destination: string;
};

export type ChatbotSetting = {
  enabled: boolean;
  name: string;
};

export type AllSettings = {
  company: CompanySetting;
  missedCall: MissedCallSetting;
  reviews: ReviewsSetting;
  chatbot: ChatbotSetting;
};

/** Configured-or-not booleans from /api/admin/integrations (values never leave the server). */
export type IntegrationStatus = {
  ai: boolean;
  sms: boolean;
  email: boolean;
  maps: boolean;
  analytics: boolean;
  authSecret: boolean;
};

export const DEFAULT_SETTINGS: AllSettings = {
  company: {
    name: "Golden Rule Air Conditioning & Heating",
    phone: "281-500-7874",
    email: "",
    street: "9306 Thomasville Dr.",
    city: "Houston",
    state: "TX",
    zip: "77064",
    license: "TACLA27294C",
    hours: "",
    emergencyService: true,
  },
  missedCall: {
    enabled: true,
    message:
      "Hi! This is Golden Rule Air Conditioning & Heating. We noticed we missed your call. How can we help?",
    businessHoursOnly: false,
    followUpMinutes: 30,
  },
  reviews: {
    enabled: true,
    delayHours: 24,
    channel: "SMS",
    message:
      "Thank you for choosing Golden Rule Air Conditioning & Heating! We'd love to hear about your experience.",
    destination: "",
  },
  chatbot: { enabled: true, name: "Golden Rule Comfort Assistant" },
};
