import type { Metadata } from "next";
import { ADMIN_ROLES } from "@/lib/auth";
import { getSetting } from "@/lib/leads";
import { requirePageSession, AccessDenied } from "@/components/admin/cms/guard";
import { SettingsPanels } from "@/components/admin/cms/SettingsPanels";
import {
  DEFAULT_SETTINGS,
  type AllSettings,
  type IntegrationStatus,
} from "@/components/admin/cms/settings-shared";

export const metadata: Metadata = {
  title: "Settings",
  alternates: { canonical: "/admin/settings" },
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requirePageSession(ADMIN_ROLES);
  if (!user) return <AccessDenied roles={ADMIN_ROLES} />;

  const [company, missedCall, reviews, chatbot] = await Promise.all([
    getSetting("company", DEFAULT_SETTINGS.company),
    getSetting("missedCall", DEFAULT_SETTINGS.missedCall),
    getSetting("reviews", DEFAULT_SETTINGS.reviews),
    getSetting("chatbot", DEFAULT_SETTINGS.chatbot),
  ]);
  const initial: AllSettings = {
    // Spread the defaults under the stored value so older rows missing a
    // newer field still render a complete form.
    company: { ...DEFAULT_SETTINGS.company, ...company },
    missedCall: { ...DEFAULT_SETTINGS.missedCall, ...missedCall },
    reviews: { ...DEFAULT_SETTINGS.reviews, ...reviews },
    chatbot: { ...DEFAULT_SETTINGS.chatbot, ...chatbot },
  };

  // Same booleans /api/admin/integrations reports — presence only, never values.
  const integrations: IntegrationStatus = {
    ai: Boolean(process.env.AI_API_KEY),
    sms: Boolean(process.env.SMS_API_KEY),
    email: Boolean(process.env.EMAIL_API_KEY),
    maps: Boolean(process.env.MAPS_API_KEY),
    analytics: Boolean(process.env.ANALYTICS_ID),
    authSecret: Boolean(process.env.AUTH_SECRET),
  };

  return <SettingsPanels initial={initial} integrations={integrations} />;
}
