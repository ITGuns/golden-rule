"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { track } from "@/lib/analytics-client";
import { CheckCircle2 } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CareerForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — humans never see it
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const startedRef = useRef(false);

  function onFirstInteraction() {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_start", { form: "careers" });
    }
  }

  function validate() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Please enter your full name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Please enter a valid email address.";
    if (phone.trim().length < 7) next.phone = "Please enter a valid phone number.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/careers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          position: position.trim() || null,
          coverLetter: coverLetter.trim() || null,
          website,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      track("form_complete", { form: "careers" });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card className="p-8 text-center sm:p-10" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        <h3 className="display mt-4 text-2xl">Application received</h3>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-body">
          Thank you for your interest in joining the Golden Rule team. We have
          your application and will reach out if there is a fit — you can share
          your resume with us at that point.
        </p>
        <p className="mt-5 text-sm text-muted">
          Want to talk sooner?{" "}
          <PhoneLink
            className="font-semibold text-ink underline-offset-4 hover:underline"
            label="careers-success"
          />
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="career-name" required>
            Full name
          </Label>
          <Input
            id="career-name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onFocus={onFirstInteraction}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "career-name-error" : undefined}
          />
          <FieldError id="career-name-error" message={errors.name} />
        </div>
        <div>
          <Label htmlFor="career-position">Position of interest</Label>
          <Input
            id="career-position"
            name="position"
            placeholder="e.g. Service Technician"
            value={position}
            onFocus={onFirstInteraction}
            onChange={(e) => setPosition(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="career-email" required>
            Email
          </Label>
          <Input
            id="career-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onFocus={onFirstInteraction}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "career-email-error" : undefined}
          />
          <FieldError id="career-email-error" message={errors.email} />
        </div>
        <div>
          <Label htmlFor="career-phone" required>
            Phone
          </Label>
          <Input
            id="career-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            value={phone}
            onFocus={onFirstInteraction}
            onChange={(e) => setPhone(e.target.value)}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "career-phone-error" : undefined}
          />
          <FieldError id="career-phone-error" message={errors.phone} />
        </div>
      </div>

      <div>
        <Label htmlFor="career-cover-letter">Cover letter</Label>
        <Textarea
          id="career-cover-letter"
          name="coverLetter"
          rows={6}
          placeholder="Tell us about your experience and why you'd like to join Golden Rule."
          value={coverLetter}
          onFocus={onFirstInteraction}
          onChange={(e) => setCoverLetter(e.target.value)}
        />
        <p className="mt-1.5 text-sm text-muted">
          No resume upload needed here — we can discuss your resume after first
          contact.
        </p>
      </div>

      {/* Honeypot — must stay empty */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="career-website">Website</label>
        <input
          id="career-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      {status === "error" && (
        <p role="alert" className="rounded-xl bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          Something went wrong sending your application. Please try again, or
          call us at 281-500-7874.
        </p>
      )}

      <Button type="submit" size="lg" loading={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Submit Application"}
      </Button>
    </form>
  );
}
