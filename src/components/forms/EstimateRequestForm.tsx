"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { estimateRequestSchema } from "@/lib/validation";
import { SERVICE_TYPES, COMPANY } from "@/lib/site";
import { track, getUtmParams } from "@/lib/analytics-client";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/Field";
import { PhoneLink } from "@/components/layout/PhoneLink";

type EstimateValues = z.infer<typeof estimateRequestSchema>;

const FRIENDLY: Partial<Record<keyof EstimateValues, string>> = {
  name: "Please enter your full name.",
  email: "Please enter a valid email address.",
  phone: "Please enter a valid phone number.",
  service: "Please choose the service you need.",
  customerType: "Please choose the property type.",
  details: "Please shorten your message a little.",
};

export function EstimateRequestForm() {
  const reduced = useReducedMotion();
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const startedRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EstimateValues>({
    resolver: zodResolver(estimateRequestSchema),
    mode: "onTouched",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      service: "",
      customerType: "RESIDENTIAL",
      details: "",
      website: "",
    },
  });

  function markStarted() {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_start", { form: "estimate_request" });
    }
  }

  function friendlyError(field: keyof EstimateValues) {
    return errors[field] ? FRIENDLY[field] ?? "Please check this field." : undefined;
  }

  const onSubmit = handleSubmit(async (data) => {
    setStatus("submitting");
    try {
      const res = await fetch("/api/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, ...getUtmParams() }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const out = (await res.json()) as { ok?: boolean };
      if (!out.ok) throw new Error("not ok");
      track("form_complete", { form: "estimate_request", service: data.service });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  });

  if (status === "success") {
    return (
      <motion.div
        initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduced ? 0.2 : 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-3xl border border-line bg-white p-8 text-center shadow-lift sm:p-10 dark:border-night-line dark:bg-night-soft"
      >
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-gold">
          <CheckCircle2 className="size-7 text-ink" aria-hidden />
        </span>
        <h2 className="display mt-4 text-2xl dark:!text-white">Estimate request received</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
          Thank you — our team will review your request and reach out to talk through options and
          schedule your estimate.
        </p>
        <div className="mt-6 rounded-2xl bg-paper p-5 dark:bg-night">
          <p className="text-sm font-semibold text-ink dark:text-white">
            Prefer to talk it through now?
          </p>
          <PhoneLink
            label="estimate_confirmation"
            className="mt-1.5 justify-center font-display text-lg font-bold text-ink dark:text-gold"
          >
            {COMPANY.phoneVanity}
          </PhoneLink>
        </div>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      onFocusCapture={markStarted}
      noValidate
      aria-label="Estimate request form"
      className="rounded-3xl border border-line bg-white p-5 shadow-lift sm:p-8 dark:border-night-line dark:bg-night-soft"
    >
      {/* Honeypot — humans never see or fill this. */}
      <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
        <label htmlFor="est-website">Leave this field empty</label>
        <input
          id="est-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("website")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="est-name" required>
            Full name
          </Label>
          <Input
            id="est-name"
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "err-est-name" : undefined}
            {...register("name")}
          />
          <FieldError id="err-est-name" message={friendlyError("name")} />
        </div>
        <div>
          <Label htmlFor="est-email" required>
            Email
          </Label>
          <Input
            id="est-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "err-est-email" : undefined}
            {...register("email")}
          />
          <FieldError id="err-est-email" message={friendlyError("email")} />
        </div>
        <div>
          <Label htmlFor="est-phone" required>
            Phone
          </Label>
          <Input
            id="est-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="281-555-0123"
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "err-est-phone" : undefined}
            {...register("phone")}
          />
          <FieldError id="err-est-phone" message={friendlyError("phone")} />
        </div>
        <div>
          <Label htmlFor="est-service" required>
            Service needed
          </Label>
          <Select
            id="est-service"
            aria-invalid={errors.service ? true : undefined}
            aria-describedby={errors.service ? "err-est-service" : undefined}
            {...register("service")}
          >
            <option value="" disabled>
              Choose a service…
            </option>
            {SERVICE_TYPES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          <FieldError id="err-est-service" message={friendlyError("service")} />
        </div>
        <div>
          <Label htmlFor="est-customerType" required>
            Property type
          </Label>
          <Select
            id="est-customerType"
            aria-invalid={errors.customerType ? true : undefined}
            {...register("customerType")}
          >
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="NEW_CONSTRUCTION">New Construction</option>
          </Select>
          <FieldError id="err-est-customerType" message={friendlyError("customerType")} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="est-details">Project details</Label>
          <Textarea
            id="est-details"
            rows={4}
            placeholder="Tell us about your home or building, the equipment involved, and what you'd like done."
            aria-invalid={errors.details ? true : undefined}
            aria-describedby={errors.details ? "err-est-details" : undefined}
            {...register("details")}
          />
          <FieldError id="err-est-details" message={friendlyError("details")} />
        </div>
      </div>

      {status === "error" && (
        <div
          role="alert"
          className="mt-5 flex flex-col gap-3 rounded-2xl border border-danger/30 bg-red-50 p-4 sm:flex-row sm:items-center dark:bg-red-500/10"
        >
          <AlertTriangle className="size-5 shrink-0 text-danger" aria-hidden />
          <div className="text-sm text-ink dark:text-white">
            <p className="font-semibold">
              We couldn&apos;t send your request just now. Please try again — or call us and
              we&apos;ll take it over the phone.
            </p>
            <PhoneLink
              label="estimate_error_fallback"
              className="mt-1 font-display font-bold text-ink dark:text-gold"
            >
              {COMPANY.phoneVanity}
            </PhoneLink>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          No spam, ever — we only use this to prepare and schedule your estimate.
        </p>
        <Button type="submit" size="lg" loading={status === "submitting"}>
          {status === "submitting"
            ? "Sending…"
            : status === "error"
              ? "Try again"
              : "Request my estimate"}
        </Button>
      </div>
    </form>
  );
}
