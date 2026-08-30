"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  BarChart3,
  Bot,
  Building2,
  KeyRound,
  Mail,
  MapPin,
  MessageSquareText,
  PhoneMissed,
  Plug,
  Save,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Field";
import { Card, Badge } from "@/components/ui/Card";
import { Toggle } from "./Toggle";
import { apiFetch } from "./shared";
import type {
  AllSettings,
  ChatbotSetting,
  CompanySetting,
  IntegrationStatus,
  MissedCallSetting,
  ReviewsSetting,
} from "./settings-shared";

type SaveStatus = { kind: "saved" | "error"; message: string } | null;

/** Per-section PUT to /api/admin/settings with a self-clearing saved flash. */
function useSaveSetting(key: string) {
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<SaveStatus>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function save(value: unknown): Promise<boolean> {
    setSaving(true);
    setStatus(null);
    try {
      await apiFetch<{ ok: true }>("/api/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ key, value }),
      });
      setStatus({ kind: "saved", message: "Saved" });
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setStatus(null), 2500);
      return true;
    } catch (e) {
      setStatus({
        kind: "error",
        message: e instanceof Error ? e.message : "Failed to save — try again.",
      });
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { saving, status, save, setStatus };
}

/** Section chrome: icon, title, description, content and a Save row. */
function Section({
  icon,
  title,
  description,
  children,
  onSave,
  saving,
  status,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  /** Omit for read-only sections. */
  onSave?: () => void;
  saving?: boolean;
  status?: SaveStatus;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold-deep dark:text-gold">
          {icon}
        </div>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink dark:text-white">{title}</h2>
          <p className="mt-0.5 text-sm text-muted dark:text-gray-400">{description}</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">{children}</div>
      {onSave && (
        <div className="mt-5 flex items-center justify-end gap-3 border-t border-line pt-4 dark:border-night-line">
          {status?.kind === "saved" && (
            <span role="status" className="text-sm font-medium text-success">
              {status.message}
            </span>
          )}
          {status?.kind === "error" && (
            <span role="alert" className="text-sm font-medium text-danger">
              {status.message}
            </span>
          )}
          <Button size="sm" onClick={onSave} loading={saving}>
            <Save className="size-4" aria-hidden />
            Save
          </Button>
        </div>
      )}
    </Card>
  );
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <label htmlFor={id} className="text-sm font-semibold text-ink dark:text-white">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-muted dark:text-gray-400">{hint}</p>}
      </div>
      <Toggle id={id} checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/** Read-only fact shown in the company panel. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium text-ink dark:text-white">{value || "—"}</dd>
    </div>
  );
}

// ————————————————————————————————————————————————————————— Company

function CompanyPanel({ initial }: { initial: CompanySetting }) {
  const [hours, setHours] = useState(initial.hours);
  const [emergencyService, setEmergencyService] = useState(initial.emergencyService);
  const { saving, status, save } = useSaveSetting("company");

  return (
    <Section
      icon={<Building2 className="size-5" aria-hidden />}
      title="Company Information"
      description="What the automations use when they mention the business."
      onSave={() => save({ ...initial, hours: hours.trim(), emergencyService })}
      saving={saving}
      status={status}
    >
      <dl className="grid grid-cols-2 gap-4 rounded-xl bg-black/[0.03] p-4 sm:grid-cols-4 dark:bg-white/[0.05]">
        <Fact label="Name" value={initial.name} />
        <Fact label="Phone" value={initial.phone} />
        <Fact label="Email" value={initial.email || "Not published"} />
        <Fact label="License" value={initial.license} />
        <Fact label="Street" value={initial.street} />
        <Fact label="City" value={initial.city} />
        <Fact label="State" value={initial.state} />
        <Fact label="ZIP" value={initial.zip} />
      </dl>
      <p className="text-xs text-muted dark:text-gray-400">
        These details come from the verified business profile and are read-only here — the
        public pages render them from the site configuration, so a developer change is needed
        to update them everywhere at once.
      </p>

      <div>
        <Label htmlFor="company-hours">Business hours</Label>
        <Input
          id="company-hours"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          placeholder="e.g. Mon–Fri 8am–5pm"
          maxLength={200}
          aria-describedby="company-hours-hint"
        />
        <p id="company-hours-hint" className="mt-1 text-xs text-muted dark:text-gray-400">
          Hours were not published on the old site — set your real hours here before anything
          displays them. The missed-call automation can use them for its business-hours-only mode.
        </p>
      </div>

      <ToggleRow
        id="company-emergency"
        label="Emergency service available"
        hint="Matches the “Emergency Service Available” note on the public site."
        checked={emergencyService}
        onChange={setEmergencyService}
      />
    </Section>
  );
}

// ————————————————————————————————————————————————————— Missed-call

function MissedCallPanel({ initial }: { initial: MissedCallSetting }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [message, setMessage] = useState(initial.message);
  const [businessHoursOnly, setBusinessHoursOnly] = useState(initial.businessHoursOnly);
  const [followUpMinutes, setFollowUpMinutes] = useState(String(initial.followUpMinutes));
  const [fieldError, setFieldError] = useState<{ message?: string; minutes?: string }>({});
  const { saving, status, save } = useSaveSetting("missedCall");

  function submit() {
    const errs: typeof fieldError = {};
    if (!message.trim()) errs.message = "The text-back message can't be empty.";
    if (message.length > 320) errs.message = "Keep the text-back under 320 characters.";
    const minutes = Number(followUpMinutes);
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 1440) {
      errs.minutes = "Enter a whole number of minutes between 0 and 1440.";
    }
    setFieldError(errs);
    if (Object.keys(errs).length > 0) return;
    void save({ enabled, message: message.trim(), businessHoursOnly, followUpMinutes: minutes });
  }

  return (
    <Section
      icon={<PhoneMissed className="size-5" aria-hidden />}
      title="Missed-Call Text-Back"
      description="Automatically text callers you couldn't answer and open a high-priority lead."
      onSave={submit}
      saving={saving}
      status={status}
    >
      <ToggleRow
        id="missed-call-enabled"
        label="Enable text-back"
        hint="When off, incoming missed-call events are ignored — no log, no lead, no text."
        checked={enabled}
        onChange={setEnabled}
      />
      <div>
        <Label htmlFor="missed-call-message" required>
          Text-back message
        </Label>
        <Textarea
          id="missed-call-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={320}
          aria-invalid={fieldError.message ? true : undefined}
          aria-describedby="missed-call-message-count"
        />
        <p id="missed-call-message-count" className="mt-1 text-xs text-muted dark:text-gray-400">
          {message.length}/320 characters — sent as a single SMS.
        </p>
        <FieldError message={fieldError.message} />
      </div>
      <ToggleRow
        id="missed-call-hours-only"
        label="Business hours only"
        hint="Only send the automatic text during the hours set in Company Information."
        checked={businessHoursOnly}
        onChange={setBusinessHoursOnly}
      />
      <div className="max-w-xs">
        <Label htmlFor="missed-call-minutes">Follow-up reminder (minutes)</Label>
        <Input
          id="missed-call-minutes"
          type="number"
          inputMode="numeric"
          min={0}
          max={1440}
          value={followUpMinutes}
          onChange={(e) => setFollowUpMinutes(e.target.value)}
          aria-invalid={fieldError.minutes ? true : undefined}
          aria-describedby="missed-call-minutes-hint"
        />
        <p id="missed-call-minutes-hint" className="mt-1 text-xs text-muted dark:text-gray-400">
          How long to wait before flagging the lead for a follow-up. 0 disables the reminder.
        </p>
        <FieldError message={fieldError.minutes} />
      </div>
    </Section>
  );
}

// ————————————————————————————————————————————————————————— Reviews

function ReviewsPanel({ initial }: { initial: ReviewsSetting }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [delayHours, setDelayHours] = useState(String(initial.delayHours));
  const [channel, setChannel] = useState<"SMS" | "EMAIL">(initial.channel);
  const [message, setMessage] = useState(initial.message);
  const [destination, setDestination] = useState(initial.destination);
  const [fieldError, setFieldError] = useState<{ delay?: string; message?: string; destination?: string }>({});
  const { saving, status, save } = useSaveSetting("reviews");

  function submit() {
    const errs: typeof fieldError = {};
    const delay = Number(delayHours);
    if (!Number.isInteger(delay) || delay < 0 || delay > 720) {
      errs.delay = "Enter a whole number of hours between 0 and 720.";
    }
    if (!message.trim()) errs.message = "The request message can't be empty.";
    if (message.length > 500) errs.message = "Keep the request message under 500 characters.";
    const dest = destination.trim();
    if (dest !== "" && !/^https?:\/\/\S+$/.test(dest)) {
      errs.destination = "Must be a full URL (https://…) or left empty.";
    }
    setFieldError(errs);
    if (Object.keys(errs).length > 0) return;
    void save({ enabled, delayHours: delay, channel, message: message.trim(), destination: dest });
  }

  return (
    <Section
      icon={<Star className="size-5" aria-hidden />}
      title="Review Requests"
      description="Ask happy customers for a review after a job is marked complete."
      onSave={submit}
      saving={saving}
      status={status}
    >
      <ToggleRow
        id="reviews-enabled"
        label="Enable review requests"
        hint="Requests are triggered when a lead reaches the “Review requested” status."
        checked={enabled}
        onChange={setEnabled}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="reviews-delay">Send delay (hours)</Label>
          <Input
            id="reviews-delay"
            type="number"
            inputMode="numeric"
            min={0}
            max={720}
            value={delayHours}
            onChange={(e) => setDelayHours(e.target.value)}
            aria-invalid={fieldError.delay ? true : undefined}
          />
          <FieldError message={fieldError.delay} />
        </div>
        <div>
          <Label htmlFor="reviews-channel">Channel</Label>
          <Select
            id="reviews-channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value === "EMAIL" ? "EMAIL" : "SMS")}
          >
            <option value="SMS">SMS</option>
            <option value="EMAIL">Email</option>
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="reviews-message" required>
          Request message
        </Label>
        <Textarea
          id="reviews-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          maxLength={500}
          aria-invalid={fieldError.message ? true : undefined}
          aria-describedby="reviews-message-count"
        />
        <p id="reviews-message-count" className="mt-1 text-xs text-muted dark:text-gray-400">
          {message.length}/500 characters — use {"{name}"} to insert the customer&rsquo;s first
          name.
        </p>
        <FieldError message={fieldError.message} />
      </div>
      <div>
        <Label htmlFor="reviews-destination">Review link</Label>
        <Input
          id="reviews-destination"
          type="url"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="https://…"
          aria-invalid={fieldError.destination ? true : undefined}
          aria-describedby="reviews-destination-hint"
        />
        <p id="reviews-destination-hint" className="mt-1 text-xs text-muted dark:text-gray-400">
          Full link to your preferred review page (Google Business Profile, Facebook, …). Leave
          empty to send the message without a link.
        </p>
        <FieldError message={fieldError.destination} />
      </div>
    </Section>
  );
}

// ————————————————————————————————————————————————————————— Chatbot

function ChatbotPanel({ initial, aiConfigured }: { initial: ChatbotSetting; aiConfigured: boolean }) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [name, setName] = useState(initial.name);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const { saving, status, save } = useSaveSetting("chatbot");

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      setFieldError("Give the assistant a display name.");
      return;
    }
    if (trimmed.length > 60) {
      setFieldError("Keep the name under 60 characters.");
      return;
    }
    setFieldError(undefined);
    void save({ enabled, name: trimmed });
  }

  return (
    <Section
      icon={<Bot className="size-5" aria-hidden />}
      title="Chatbot"
      description="The website chat assistant that answers questions and captures leads."
      onSave={submit}
      saving={saving}
      status={status}
    >
      <ToggleRow
        id="chatbot-enabled"
        label="Enable the chat widget"
        hint="Shown in the corner of every public page."
        checked={enabled}
        onChange={setEnabled}
      />
      <div className="max-w-sm">
        <Label htmlFor="chatbot-name" required>
          Display name
        </Label>
        <Input
          id="chatbot-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          aria-invalid={fieldError ? true : undefined}
        />
        <FieldError message={fieldError} />
      </div>
      <p className="rounded-xl bg-black/[0.03] px-3 py-2 text-xs text-muted dark:bg-white/[0.06] dark:text-gray-400">
        {aiConfigured
          ? "AI_API_KEY is configured — the assistant answers with AI and hands qualified chats to the lead pipeline."
          : "AI_API_KEY isn't configured — the assistant falls back to its built-in guided flow. Add the key to enable AI answers."}
      </p>
    </Section>
  );
}

// —————————————————————————————————————————————————— Read-only panels

const INTEGRATION_CARDS: {
  key: keyof Omit<IntegrationStatus, "authSecret">;
  label: string;
  env: string;
  powers: string;
  icon: ReactNode;
}[] = [
  {
    key: "ai",
    label: "AI",
    env: "AI_API_KEY",
    powers: "AI chatbot answers and dashboard insights.",
    icon: <Sparkles className="size-4" aria-hidden />,
  },
  {
    key: "sms",
    label: "SMS",
    env: "SMS_API_KEY",
    powers: "Real text delivery for text-back and review requests (mocked until set).",
    icon: <MessageSquareText className="size-4" aria-hidden />,
  },
  {
    key: "email",
    label: "Email",
    env: "EMAIL_API_KEY",
    powers: "Outbound email delivery.",
    icon: <Mail className="size-4" aria-hidden />,
  },
  {
    key: "maps",
    label: "Maps",
    env: "MAPS_API_KEY",
    powers: "Map embeds and service-area rendering.",
    icon: <MapPin className="size-4" aria-hidden />,
  },
  {
    key: "analytics",
    label: "Analytics",
    env: "ANALYTICS_ID",
    powers: "Third-party analytics alongside the built-in tracker.",
    icon: <BarChart3 className="size-4" aria-hidden />,
  },
];

function IntegrationsPanel({ integrations }: { integrations: IntegrationStatus }) {
  return (
    <Section
      icon={<Plug className="size-5" aria-hidden />}
      title="Integrations"
      description="Provider keys are read from the server environment — only their presence is shown here."
    >
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {INTEGRATION_CARDS.map((card) => {
          const configured = integrations[card.key];
          return (
            <li
              key={card.key}
              className="rounded-xl border border-line p-4 dark:border-night-line"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-semibold text-ink dark:text-white">
                  {card.icon}
                  {card.label}
                </p>
                <Badge tone={configured ? "green" : "neutral"}>
                  {configured ? "Configured" : "Not configured"}
                </Badge>
              </div>
              <p className="mt-2 text-xs text-muted dark:text-gray-400">{card.powers}</p>
              <p className="mt-1 font-mono text-[11px] text-muted dark:text-gray-500">{card.env}</p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function SecurityPanel({ integrations }: { integrations: IntegrationStatus }) {
  return (
    <Section
      icon={<KeyRound className="size-5" aria-hidden />}
      title="API & Security"
      description="Server-side secrets for sessions and providers."
    >
      <div className="flex items-center justify-between gap-4 rounded-xl border border-line p-4 dark:border-night-line">
        <div>
          <p className="text-sm font-semibold text-ink dark:text-white">Session signing secret</p>
          <p className="mt-0.5 text-xs text-muted dark:text-gray-400">
            <code className="font-mono">AUTH_SECRET</code> signs admin session cookies.
            {integrations.authSecret
              ? ""
              : " Without it, a development-only fallback is used — set it before going to production."}
          </p>
        </div>
        <Badge tone={integrations.authSecret ? "green" : "red"}>
          {integrations.authSecret ? "Set" : "Not set"}
        </Badge>
      </div>
      <p className="text-xs text-muted dark:text-gray-400">
        Secrets are set as environment variables on the server — see{" "}
        <code className="font-mono">.env.example</code> in the project root for the full list
        with setup notes. Values are never shown or stored in the database.
      </p>
    </Section>
  );
}

// ————————————————————————————————————————————————————————— Export

/** Sectioned settings screen with per-section save + status feedback. */
export function SettingsPanels({
  initial,
  integrations,
}: {
  initial: AllSettings;
  integrations: IntegrationStatus;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Organization</p>
        <h1 className="display text-2xl text-ink dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-muted dark:text-gray-400">
          Automations, chat and integrations. Each section saves on its own.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <CompanyPanel initial={initial.company} />
          <MissedCallPanel initial={initial.missedCall} />
          <ChatbotPanel initial={initial.chatbot} aiConfigured={integrations.ai} />
        </div>
        <div className="space-y-6">
          <ReviewsPanel initial={initial.reviews} />
          <IntegrationsPanel integrations={integrations} />
          <SecurityPanel integrations={integrations} />
        </div>
      </div>
    </div>
  );
}
