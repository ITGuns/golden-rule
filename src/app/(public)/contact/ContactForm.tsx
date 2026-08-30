"use client";

import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FieldError } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { PhoneLink } from "@/components/layout/PhoneLink";
import { track, getUtmParams } from "@/lib/analytics-client";
import { CheckCircle2 } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — humans never see it
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Status>("idle");
  const startedRef = useRef(false);

  function onFirstInteraction() {
    if (!startedRef.current) {
      startedRef.current = true;
      track("form_start", { form: "contact" });
    }
  }

  function validate() {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Please enter your name.";
    if (!EMAIL_RE.test(email.trim())) next.email = "Please enter a valid email address.";
    if (message.trim().length < 5) next.message = "Please enter a message.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          message: message.trim(),
          website,
          ...getUtmParams(),
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      track("form_complete", { form: "contact" });
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card className="p-8 text-center sm:p-10" role="status" aria-live="polite">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden />
        <h3 className="display mt-4 text-2xl">Message sent</h3>
        <p className="mx-auto mt-3 max-w-md leading-relaxed text-body">
          Thank you for reaching out. Our team will get back to you as soon as
          possible.
        </p>
        <p className="mt-5 text-sm text-muted">
          Need help right away?{" "}
          <PhoneLink
            className="font-semibold text-ink underline-offset-4 hover:underline"
            label="contact-success"
          />
        </p>
      </Card>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div>
        <Label htmlFor="contact-name" required>
          Full name
        </Label>
        <Input
          id="contact-name"
          name="name"
          autoComplete="name"
          required
          value={name}
          onFocus={onFirstInteraction}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? "contact-name-error" : undefined}
        />
        <FieldError id="contact-name-error" message={errors.name} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-email" required>
            Email
          </Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onFocus={onFirstInteraction}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
          />
          <FieldError id="contact-email-error" message={errors.email} />
        </div>
        <div>
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onFocus={onFirstInteraction}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="contact-message" required>
          How can we help?
        </Label>
        <Textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          placeholder="Tell us about your question or the issue you're seeing."
          value={message}
          onFocus={onFirstInteraction}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
        />
        <FieldError id="contact-message-error" message={errors.message} />
      </div>

      {/* Honeypot — must stay empty */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
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
          Something went wrong sending your message. Please try again, or call
          us at 281-500-7874.
        </p>
      )}

      <Button type="submit" size="lg" loading={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send Message"}
      </Button>
    </form>
  );
}
