"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import {
  AirVent,
  AlertTriangle,
  Building2,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Film,
  Flame,
  HardHat,
  HelpCircle,
  Home,
  Leaf,
  Pencil,
  ShieldCheck,
  Snowflake,
  Sunrise,
  Sunset,
  Thermometer,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import { serviceRequestSchema } from "@/lib/validation";
import { SERVICE_TYPES, SERVICE_CITIES, COMPANY } from "@/lib/site";
import { track, getUtmParams } from "@/lib/analytics-client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Field";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { cn } from "@/lib/utils";

type WizardValues = z.infer<typeof serviceRequestSchema>;
type ServiceType = (typeof SERVICE_TYPES)[number];
type Attachment = { path: string; name: string; kind: "image" | "video" };

/* ————— Step definitions ————— */

const STEPS: {
  id: string;
  label: string;
  heading: string;
  sub?: string;
  fields: FieldPath<WizardValues>[];
}[] = [
  {
    id: "service",
    label: "Service",
    heading: "What do you need help with?",
    sub: "Pick the closest match — you can describe details later.",
    fields: ["serviceType"],
  },
  {
    id: "customer-type",
    label: "Property",
    heading: "What kind of property is it?",
    fields: ["customerType"],
  },
  {
    id: "contact",
    label: "Contact",
    heading: "How can we reach you?",
    sub: "Our dispatch team uses this to confirm your appointment.",
    fields: ["firstName", "lastName", "email", "phone"],
  },
  {
    id: "address",
    label: "Address",
    heading: "Where is the work needed?",
    fields: ["street", "city", "zip"],
  },
  {
    id: "date",
    label: "Date",
    heading: "When would you like us to come out?",
    sub: "Optional — leave blank for the first available opening.",
    fields: ["preferredDate"],
  },
  {
    id: "time",
    label: "Time",
    heading: "What time of day works best?",
    fields: ["preferredTime"],
  },
  {
    id: "details",
    label: "Details",
    heading: "Describe the problem",
    sub: "Anything helps: symptoms, sounds, equipment age, error codes.",
    fields: ["description"],
  },
  {
    id: "photos",
    label: "Photos",
    heading: "Add photos or a short video",
    sub: "Optional, but it helps our technicians arrive prepared.",
    fields: [],
  },
  {
    id: "review",
    label: "Review",
    heading: "Review your request",
    sub: "Double-check everything, then send it to our team.",
    fields: [],
  },
];

const REVIEW_STEP = STEPS.length - 1;

const SERVICE_ICONS: Record<ServiceType, typeof Wrench> = {
  "AC Repair": Wrench,
  "AC Installation": Snowflake,
  Heating: Flame,
  Maintenance: ShieldCheck,
  "Air Duct": AirVent,
  "Indoor Air Quality": Leaf,
  "Heat Pump": Thermometer,
  Commercial: Building2,
  "New Construction": HardHat,
  Other: HelpCircle,
};

const CUSTOMER_TYPES = [
  { value: "RESIDENTIAL", label: "Residential", detail: "Homes, townhomes & condos", icon: Home },
  { value: "COMMERCIAL", label: "Commercial", detail: "Offices, retail, restaurants & more", icon: Building2 },
  { value: "NEW_CONSTRUCTION", label: "New Construction", detail: "New builds & major projects", icon: HardHat },
] as const;

const TIME_WINDOWS = [
  { value: "Morning (8-12)", label: "Morning", detail: "8 AM – 12 PM", icon: Sunrise },
  { value: "Afternoon (12-4)", label: "Afternoon", detail: "12 PM – 4 PM", icon: Clock },
  { value: "Evening (4-7)", label: "Evening", detail: "4 PM – 7 PM", icon: Sunset },
  { value: "First available", label: "First available", detail: "Soonest opening we have", icon: Zap },
] as const;

/** Friendly validation copy (zod's defaults are too technical for homeowners). */
const FRIENDLY: Partial<Record<FieldPath<WizardValues>, string>> = {
  serviceType: "Please choose a service to continue.",
  customerType: "Please choose the property type.",
  firstName: "Please enter your first name.",
  lastName: "Please enter your last name.",
  email: "Please enter a valid email address.",
  phone: "Please enter a valid phone number.",
  street: "Please enter the street address.",
  city: "Please enter the city.",
  zip: "Please enter a valid ZIP code.",
  preferredDate: "That date doesn't look right.",
  preferredTime: "That time doesn't look right.",
  description: "Please shorten your description a little.",
};

const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "video/mp4",
  "video/quicktime",
]);
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 3;

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function formatWizardDate(iso?: string | null) {
  if (!iso) return "First available";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ————— Small presentational helpers ————— */

function OptionCard({
  selected,
  onSelect,
  icon: Icon,
  label,
  detail,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: typeof Wrench;
  label: string;
  detail?: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group flex w-full flex-col items-start gap-2 rounded-2xl border-2 p-4 text-left transition-all duration-200",
        "focus-visible:outline-3 focus-visible:outline-gold",
        selected
          ? "border-ink bg-gold shadow-gold"
          : "border-line bg-white hover:-translate-y-0.5 hover:border-ink/40 hover:shadow-lift dark:border-night-line dark:bg-night-soft dark:hover:border-white/30"
      )}
    >
      <span
        className={cn(
          "flex size-10 items-center justify-center rounded-xl transition-colors",
          selected ? "bg-ink text-gold" : "bg-gold-soft text-ink dark:bg-gold/15 dark:text-gold"
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <span
        className={cn(
          "font-display text-[15px] font-semibold leading-tight",
          selected ? "text-ink" : "text-ink dark:text-white"
        )}
      >
        {label}
      </span>
      {detail && (
        <span className={cn("text-sm leading-snug", selected ? "text-ink/70" : "text-muted")}>
          {detail}
        </span>
      )}
    </button>
  );
}

function ReviewRow({
  label,
  value,
  onEdit,
  editLabel,
}: {
  label: string;
  value: ReactNode;
  onEdit: () => void;
  editLabel: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
        <div className="mt-0.5 break-words text-[15px] text-ink dark:text-white">{value}</div>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={editLabel}
        className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-gold-deep transition-colors hover:bg-gold-soft focus-visible:outline-3 focus-visible:outline-gold dark:hover:bg-gold/15"
      >
        <Pencil className="size-3.5" aria-hidden />
        Edit
      </button>
    </div>
  );
}

/* ————— The wizard ————— */

export function ServiceRequestWizard() {
  const reduced = useReducedMotion();
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [editReturn, setEditReturn] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [cityMode, setCityMode] = useState<"list" | "other">("list");
  const startedRef = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);
  const today = useMemo(localToday, []);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<WizardValues>({
    resolver: zodResolver(serviceRequestSchema),
    mode: "onTouched",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      street: "",
      city: "",
      zip: "",
      preferredDate: "",
      preferredTime: "",
      description: "",
      website: "",
    },
  });

  const values = watch();
  const done = requestId !== null;

  /* Move focus to the step heading whenever the step changes (not on mount). */
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    const t = window.setTimeout(() => headingRef.current?.focus(), reduced ? 0 : 220);
    return () => window.clearTimeout(t);
  }, [step, done, reduced]);

  function markStarted() {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_start", { form: "service_request" });
    }
  }

  function friendlyError(field: FieldPath<WizardValues>) {
    return errors[field] ? FRIENDLY[field] ?? "Please check this field." : undefined;
  }

  async function goNext() {
    markStarted();
    const fields = STEPS[step].fields;
    if (fields.length > 0) {
      const ok = await trigger(fields, { shouldFocus: true });
      if (!ok) return;
    }
    setDir(1);
    if (editReturn) {
      setEditReturn(false);
      setStep(REVIEW_STEP);
    } else {
      setStep((s) => Math.min(s + 1, REVIEW_STEP));
    }
  }

  function goBack() {
    setDir(-1);
    setEditReturn(false);
    setStep((s) => Math.max(s - 1, 0));
  }

  function jumpTo(target: number) {
    setDir(target > step ? 1 : -1);
    setEditReturn(true);
    setStep(target);
  }

  function selectAndAdvance(assign: () => void) {
    markStarted();
    assign();
    window.setTimeout(() => void goNext(), reduced ? 0 : 180);
  }

  /* ————— Uploads ————— */

  async function handleFiles(list: FileList | null) {
    setUploadError(null);
    if (!list || list.length === 0) return;
    const incoming = Array.from(list);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const room = MAX_FILES - attachments.length;
    if (incoming.length > room) {
      setUploadError(
        room === 0
          ? `You can attach up to ${MAX_FILES} files. Remove one to add another.`
          : `Only ${room} more file${room === 1 ? "" : "s"} can be added.`
      );
      return;
    }
    for (const f of incoming) {
      if (!ALLOWED_UPLOAD_TYPES.has(f.type)) {
        setUploadError("Only JPG, PNG, WEBP or HEIC photos and MP4 or MOV videos are supported.");
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        setUploadError("Each file must be 8 MB or smaller.");
        return;
      }
    }

    const fd = new FormData();
    for (const f of incoming) fd.append("files", f);
    setUploading(true);
    try {
      const res = await fetch("/api/uploads", { method: "POST", body: fd });
      if (!res.ok) throw new Error("upload failed");
      const data = (await res.json()) as { paths?: string[] };
      const paths = data.paths ?? [];
      setAttachments((prev) => [
        ...prev,
        ...paths.map((path, i) => ({
          path,
          name: incoming[i]?.name ?? path.split("/").pop() ?? "file",
          kind: (incoming[i]?.type ?? "").startsWith("video/") ? ("video" as const) : ("image" as const),
        })),
      ]);
    } catch {
      setUploadError("Upload didn't go through. You can try again, or continue without photos.");
    } finally {
      setUploading(false);
    }
  }

  function removeAttachment(path: string) {
    setAttachments((prev) => prev.filter((a) => a.path !== path));
  }

  /* ————— Submit ————— */

  const submitRequest = handleSubmit(
    async (data) => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const res = await fetch("/api/service-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...data,
            attachments: attachments.map((a) => a.path),
            ...getUtmParams(),
          }),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const out = (await res.json()) as { ok?: boolean; requestId?: string };
        if (!out.ok) throw new Error("not ok");
        track("form_complete", { form: "service_request", serviceType: data.serviceType });
        setRequestId(out.requestId ?? "");
      } catch {
        setSubmitError(
          "We couldn't send your request just now. Please try again in a moment — or call us and we'll take it over the phone."
        );
      } finally {
        setSubmitting(false);
      }
    },
    (invalidFields) => {
      // A field on an earlier step failed validation — send the user there.
      const firstBad = STEPS.findIndex((s) => s.fields.some((f) => f in invalidFields));
      if (firstBad >= 0) {
        setDir(-1);
        setStep(firstBad);
      }
    }
  );

  function onFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === REVIEW_STEP) void submitRequest();
    else void goNext();
  }

  /* ————— Render ————— */

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  const stepVariants = {
    enter: (d: number) => (reduced ? { opacity: 0 } : { opacity: 0, x: d * 42 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => (reduced ? { opacity: 0 } : { opacity: 0, x: d * -42 }),
  };

  if (done) {
    return (
      <div className="rounded-3xl border border-line bg-white p-6 shadow-lift sm:p-10 dark:border-night-line dark:bg-night-soft">
        <motion.div
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-gold">
            <CheckCircle2 className="size-8 text-ink" aria-hidden />
          </span>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="display mt-5 text-2xl focus:outline-none sm:text-3xl dark:!text-white"
          >
            Request received — thank you!
          </h2>
          {requestId && (
            <p className="mt-2 text-sm text-muted">
              Reference: <span className="font-mono font-semibold uppercase">{requestId.slice(-6)}</span>
            </p>
          )}
          <div className="mx-auto mt-8 max-w-md text-left">
            <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted">
              What happens next
            </h3>
            <ol className="mt-3 space-y-3">
              {[
                "Our dispatch team reviews your request and the details you shared.",
                "We call or text you to confirm a time that works for your schedule.",
                "A courteous, background-checked technician arrives to take care of it.",
              ].map((line, i) => (
                <li key={i} className="flex gap-3 text-[15px] text-body dark:text-gray-300">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-gold-soft font-display text-xs font-bold text-ink dark:bg-gold/15 dark:text-gold">
                    {i + 1}
                  </span>
                  {line}
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-8 rounded-2xl bg-paper p-5 dark:bg-night">
            <p className="text-sm font-semibold text-ink dark:text-white">
              Need us sooner? {COMPANY.emergencyNote}.
            </p>
            <PhoneLink
              label="wizard_confirmation"
              className="mt-2 justify-center font-display text-xl font-bold text-ink dark:text-gold"
            >
              {COMPANY.phoneVanity}
            </PhoneLink>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onFormSubmit}
      onFocusCapture={markStarted}
      noValidate
      className="rounded-3xl border border-line bg-white p-5 shadow-lift sm:p-8 dark:border-night-line dark:bg-night-soft"
      aria-label="Service request form"
    >
      {/* Honeypot — humans never see or fill this. */}
      <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
        <label htmlFor="sr-website">Leave this field empty</label>
        <input
          id="sr-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-muted">
            Step {step + 1} of {STEPS.length}
            <span className="sr-only">: {current.label}</span>
          </p>
          <p aria-hidden className="font-display text-sm font-semibold text-gold-deep">
            {current.label}
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={STEPS.length}
          aria-valuenow={step + 1}
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-line dark:bg-night-line"
        >
          <div
            className="h-full rounded-full bg-gold transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* No AnimatePresence exit gating: step advancement must never depend on an
          animation completing (rAF is throttled in hidden/background tabs). */}
      <motion.div
        key={current.id}
        custom={dir}
        variants={stepVariants}
        initial="enter"
        animate="center"
        transition={
          reduced ? { duration: 0.15 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
        }
      >
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="display text-xl focus:outline-none sm:text-2xl dark:!text-white"
          >
            {current.heading}
          </h2>
          {current.sub && <p className="mt-1.5 text-sm text-muted">{current.sub}</p>}

          <div className="mt-6">
            {/* Step 1 — service type */}
            {current.id === "service" && (
              <div role="group" aria-label="Choose a service">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {SERVICE_TYPES.map((s) => (
                    <OptionCard
                      key={s}
                      label={s}
                      icon={SERVICE_ICONS[s]}
                      selected={values.serviceType === s}
                      onSelect={() =>
                        selectAndAdvance(() =>
                          setValue("serviceType", s, { shouldValidate: true })
                        )
                      }
                    />
                  ))}
                </div>
                <FieldError id="err-serviceType" message={friendlyError("serviceType")} />
              </div>
            )}

            {/* Step 2 — customer type */}
            {current.id === "customer-type" && (
              <div role="group" aria-label="Choose the property type">
                <div className="grid gap-3 sm:grid-cols-3">
                  {CUSTOMER_TYPES.map((c) => (
                    <OptionCard
                      key={c.value}
                      label={c.label}
                      detail={c.detail}
                      icon={c.icon}
                      selected={values.customerType === c.value}
                      onSelect={() =>
                        selectAndAdvance(() =>
                          setValue("customerType", c.value, { shouldValidate: true })
                        )
                      }
                    />
                  ))}
                </div>
                <FieldError id="err-customerType" message={friendlyError("customerType")} />
              </div>
            )}

            {/* Step 3 — contact */}
            {current.id === "contact" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="sr-firstName" required>
                    First name
                  </Label>
                  <Input
                    id="sr-firstName"
                    autoComplete="given-name"
                    aria-invalid={errors.firstName ? true : undefined}
                    aria-describedby={errors.firstName ? "err-firstName" : undefined}
                    {...register("firstName")}
                  />
                  <FieldError id="err-firstName" message={friendlyError("firstName")} />
                </div>
                <div>
                  <Label htmlFor="sr-lastName" required>
                    Last name
                  </Label>
                  <Input
                    id="sr-lastName"
                    autoComplete="family-name"
                    aria-invalid={errors.lastName ? true : undefined}
                    aria-describedby={errors.lastName ? "err-lastName" : undefined}
                    {...register("lastName")}
                  />
                  <FieldError id="err-lastName" message={friendlyError("lastName")} />
                </div>
                <div>
                  <Label htmlFor="sr-email" required>
                    Email
                  </Label>
                  <Input
                    id="sr-email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    aria-invalid={errors.email ? true : undefined}
                    aria-describedby={errors.email ? "err-email" : undefined}
                    {...register("email")}
                  />
                  <FieldError id="err-email" message={friendlyError("email")} />
                </div>
                <div>
                  <Label htmlFor="sr-phone" required>
                    Phone
                  </Label>
                  <Input
                    id="sr-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="281-555-0123"
                    aria-invalid={errors.phone ? true : undefined}
                    aria-describedby={errors.phone ? "err-phone" : undefined}
                    {...register("phone")}
                  />
                  <FieldError id="err-phone" message={friendlyError("phone")} />
                </div>
              </div>
            )}

            {/* Step 4 — address */}
            {current.id === "address" && (
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="sr-street" required>
                    Street address
                  </Label>
                  <Input
                    id="sr-street"
                    autoComplete="address-line1"
                    placeholder="9306 Thomasville Dr."
                    aria-invalid={errors.street ? true : undefined}
                    aria-describedby={errors.street ? "err-street" : undefined}
                    {...register("street")}
                  />
                  <FieldError id="err-street" message={friendlyError("street")} />
                </div>
                <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
                  <div>
                    <Label htmlFor="sr-city-select" required>
                      City
                    </Label>
                    <Select
                      id="sr-city-select"
                      value={cityMode === "other" ? "__other" : values.city || ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "__other") {
                          setCityMode("other");
                          setValue("city", "", { shouldValidate: false });
                        } else {
                          setCityMode("list");
                          setValue("city", v, { shouldValidate: true });
                        }
                      }}
                      aria-invalid={errors.city && cityMode === "list" ? true : undefined}
                    >
                      <option value="" disabled>
                        Choose a city…
                      </option>
                      {SERVICE_CITIES.map((c) => (
                        <option key={c.slug} value={c.city}>
                          {c.city}
                        </option>
                      ))}
                      <option value="__other">Somewhere else…</option>
                    </Select>
                    {cityMode === "other" && (
                      <div className="mt-3">
                        <Label htmlFor="sr-city">Type your city</Label>
                        <Input
                          id="sr-city"
                          autoComplete="address-level2"
                          aria-invalid={errors.city ? true : undefined}
                          aria-describedby={errors.city ? "err-city" : undefined}
                          {...register("city")}
                        />
                      </div>
                    )}
                    <FieldError id="err-city" message={friendlyError("city")} />
                  </div>
                  <div>
                    <Label htmlFor="sr-zip" required>
                      ZIP
                    </Label>
                    <Input
                      id="sr-zip"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      placeholder="77064"
                      aria-invalid={errors.zip ? true : undefined}
                      aria-describedby={errors.zip ? "err-zip" : undefined}
                      {...register("zip")}
                    />
                    <FieldError id="err-zip" message={friendlyError("zip")} />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5 — preferred date */}
            {current.id === "date" && (
              <div className="max-w-xs">
                <Label htmlFor="sr-date">Preferred date</Label>
                <Input
                  id="sr-date"
                  type="date"
                  min={today}
                  aria-describedby="sr-date-hint"
                  {...register("preferredDate")}
                />
                <p id="sr-date-hint" className="mt-2 text-sm text-muted">
                  Skip this step and we&apos;ll offer the first available opening.
                </p>
                <FieldError id="err-preferredDate" message={friendlyError("preferredDate")} />
              </div>
            )}

            {/* Step 6 — preferred time */}
            {current.id === "time" && (
              <div role="group" aria-label="Choose a time window">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {TIME_WINDOWS.map((t) => (
                    <OptionCard
                      key={t.value}
                      label={t.label}
                      detail={t.detail}
                      icon={t.icon}
                      selected={values.preferredTime === t.value}
                      onSelect={() =>
                        selectAndAdvance(() =>
                          setValue("preferredTime", t.value, { shouldValidate: true })
                        )
                      }
                    />
                  ))}
                </div>
                <FieldError id="err-preferredTime" message={friendlyError("preferredTime")} />
              </div>
            )}

            {/* Step 7 — description */}
            {current.id === "details" && (
              <div>
                <Label htmlFor="sr-description">What&apos;s going on?</Label>
                <Textarea
                  id="sr-description"
                  rows={5}
                  placeholder="Example: The AC runs but blows warm air upstairs. It started two days ago and the outdoor unit is making a clicking sound."
                  aria-invalid={errors.description ? true : undefined}
                  aria-describedby={errors.description ? "err-description" : undefined}
                  {...register("description")}
                />
                <FieldError id="err-description" message={friendlyError("description")} />
              </div>
            )}

            {/* Step 8 — photos */}
            {current.id === "photos" && (
              <div>
                <input
                  ref={fileInputRef}
                  id="sr-files"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime"
                  className="sr-only"
                  onChange={(e) => void handleFiles(e.target.files)}
                  aria-describedby="sr-files-hint"
                />
                <div className="rounded-2xl border-2 border-dashed border-line p-6 text-center dark:border-night-line">
                  <Camera className="mx-auto size-8 text-muted" aria-hidden />
                  <p id="sr-files-hint" className="mt-3 text-sm text-muted">
                    Up to {MAX_FILES} files — JPG, PNG, WEBP, HEIC, MP4 or MOV, 8 MB max each.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-4 dark:border-white/70 dark:text-white dark:hover:bg-white dark:hover:text-ink"
                    loading={uploading}
                    disabled={attachments.length >= MAX_FILES}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading
                      ? "Uploading…"
                      : attachments.length > 0
                        ? "Add another file"
                        : "Choose files"}
                  </Button>
                </div>
                {uploadError && (
                  <p role="alert" className="mt-3 text-sm font-medium text-danger">
                    {uploadError}
                  </p>
                )}
                {attachments.length > 0 && (
                  <ul className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Attached files">
                    {attachments.map((a) => (
                      <li
                        key={a.path}
                        className="group relative overflow-hidden rounded-xl border border-line dark:border-night-line"
                      >
                        {a.kind === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={a.path}
                            alt={`Attachment preview: ${a.name}`}
                            className="h-24 w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-24 w-full items-center justify-center bg-paper dark:bg-night">
                            <Film className="size-6 text-muted" aria-hidden />
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2 px-2 py-1.5">
                          <span className="truncate text-xs text-muted">{a.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(a.path)}
                            aria-label={`Remove ${a.name}`}
                            className="rounded p-1 text-muted transition-colors hover:bg-black/5 hover:text-danger focus-visible:outline-3 focus-visible:outline-gold dark:hover:bg-white/10"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Step 9 — review */}
            {current.id === "review" && (
              <div>
                <div className="divide-y divide-line dark:divide-night-line">
                  <ReviewRow
                    label="Service"
                    value={values.serviceType ?? "—"}
                    onEdit={() => jumpTo(0)}
                    editLabel="Edit service"
                  />
                  <ReviewRow
                    label="Property type"
                    value={
                      CUSTOMER_TYPES.find((c) => c.value === values.customerType)?.label ?? "—"
                    }
                    onEdit={() => jumpTo(1)}
                    editLabel="Edit property type"
                  />
                  <ReviewRow
                    label="Contact"
                    value={
                      <>
                        {values.firstName} {values.lastName}
                        <br />
                        {values.email}
                        <br />
                        {values.phone}
                      </>
                    }
                    onEdit={() => jumpTo(2)}
                    editLabel="Edit contact details"
                  />
                  <ReviewRow
                    label="Address"
                    value={`${values.street}, ${values.city}, TX ${values.zip}`}
                    onEdit={() => jumpTo(3)}
                    editLabel="Edit address"
                  />
                  <ReviewRow
                    label="Preferred date"
                    value={formatWizardDate(values.preferredDate)}
                    onEdit={() => jumpTo(4)}
                    editLabel="Edit preferred date"
                  />
                  <ReviewRow
                    label="Preferred time"
                    value={values.preferredTime || "First available"}
                    onEdit={() => jumpTo(5)}
                    editLabel="Edit preferred time"
                  />
                  <ReviewRow
                    label="Problem description"
                    value={values.description?.trim() ? values.description : "Not provided"}
                    onEdit={() => jumpTo(6)}
                    editLabel="Edit problem description"
                  />
                  <ReviewRow
                    label="Photos & video"
                    value={
                      attachments.length > 0
                        ? `${attachments.length} file${attachments.length === 1 ? "" : "s"}: ${attachments
                            .map((a) => a.name)
                            .join(", ")}`
                        : "None attached"
                    }
                    onEdit={() => jumpTo(7)}
                    editLabel="Edit attachments"
                  />
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mt-5 flex flex-col gap-3 rounded-2xl border border-danger/30 bg-red-50 p-4 sm:flex-row sm:items-center dark:bg-red-500/10"
                  >
                    <AlertTriangle className="size-5 shrink-0 text-danger" aria-hidden />
                    <div className="text-sm text-ink dark:text-white">
                      <p className="font-semibold">{submitError}</p>
                      <PhoneLink
                        label="wizard_error_fallback"
                        className="mt-1 font-display font-bold text-ink dark:text-gold"
                      >
                        {COMPANY.phoneVanity}
                      </PhoneLink>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
      </motion.div>

      {/* Navigation */}
      <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5 dark:border-night-line">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={goBack} disabled={submitting}>
            <ChevronLeft className="size-4" aria-hidden />
            Back
          </Button>
        ) : (
          <span aria-hidden />
        )}
        {step === REVIEW_STEP ? (
          <Button type="submit" size="lg" loading={submitting}>
            {submitting ? "Sending…" : submitError ? "Try again" : "Send my request"}
          </Button>
        ) : (
          <Button type="submit" disabled={uploading}>
            {current.id === "photos" && attachments.length === 0 ? "Skip for now" : "Continue"}
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        )}
      </div>
    </form>
  );
}
