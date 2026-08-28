import { z } from "zod";
import { SERVICE_TYPES } from "./site";

export const utmSchema = z.object({
  utmSource: z.string().max(120).optional().nullable(),
  utmMedium: z.string().max(120).optional().nullable(),
  utmCampaign: z.string().max(120).optional().nullable(),
  utmTerm: z.string().max(120).optional().nullable(),
  utmContent: z.string().max(120).optional().nullable(),
  landingPage: z.string().max(300).optional().nullable(),
  referrer: z.string().max(300).optional().nullable(),
});

export const serviceRequestSchema = z
  .object({
    serviceType: z.enum(SERVICE_TYPES),
    customerType: z.enum(["RESIDENTIAL", "COMMERCIAL", "NEW_CONSTRUCTION"]),
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().email().max(160),
    phone: z.string().min(7).max(25),
    street: z.string().min(3).max(160),
    city: z.string().min(2).max(80),
    zip: z.string().min(5).max(10),
    preferredDate: z.string().max(30).optional().nullable(),
    preferredTime: z.string().max(40).optional().nullable(),
    description: z.string().max(4000).optional().nullable(),
    website: z.string().max(0).optional(), // honeypot — must stay empty
  })
  .merge(utmSchema);

export const contactSchema = z
  .object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(160),
    phone: z.string().max(25).optional().nullable(),
    message: z.string().min(5).max(4000),
    website: z.string().max(0).optional(), // honeypot
  })
  .merge(utmSchema);

export const estimateRequestSchema = z
  .object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(160),
    phone: z.string().min(7).max(25),
    service: z.string().min(2).max(120),
    customerType: z.enum(["RESIDENTIAL", "COMMERCIAL", "NEW_CONSTRUCTION"]),
    details: z.string().max(4000).optional().nullable(),
    website: z.string().max(0).optional(),
  })
  .merge(utmSchema);

export const careerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160),
  phone: z.string().min(7).max(25),
  position: z.string().max(120).optional().nullable(),
  coverLetter: z.string().max(6000).optional().nullable(),
  website: z.string().max(0).optional(),
});

export const chatMessageSchema = z.object({
  sessionId: z.string().max(60).optional().nullable(),
  message: z.string().min(1).max(2000),
});

export const missedCallSchema = z.object({
  phone: z.string().min(7).max(25),
  callTime: z.string().datetime().optional(),
});

export const leadPatchSchema = z.object({
  status: z
    .enum(["NEW", "CONTACTED", "QUALIFIED", "ESTIMATE", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "REVIEW_REQUESTED", "CLOSED"])
    .optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "EMERGENCY"]).optional(),
  assignedToId: z.string().nullable().optional(),
  value: z.number().nullable().optional(),
  note: z.string().max(4000).optional(),
});

export const appointmentSchema = z.object({
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  technicianId: z.string().optional().nullable(),
  service: z.string().min(2).max(120),
  start: z.string(),
  end: z.string().optional(),
  status: z
    .enum(["REQUESTED", "CONFIRMED", "RESCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"])
    .optional(),
  location: z.string().max(240).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const articleSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(140)
    .regex(/^[a-z0-9-]+$/, "lowercase letters, numbers and dashes only"),
  title: z.string().min(3).max(200),
  excerpt: z.string().min(10).max(500),
  body: z.string().min(20),
  category: z.enum(["Cooling", "Heating", "Maintenance", "Indoor Air Quality", "Energy Efficiency", "HVAC Education"]),
  heroImage: z.string().max(300).optional().nullable(),
  published: z.boolean().optional(),
});
