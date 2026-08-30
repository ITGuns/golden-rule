/**
 * Serializable DTO shapes shared between the CRM server pages (which load via
 * Prisma) and the client components (which mutate via the API routes).
 * All dates are ISO strings — use `toDTO()` to serialize Prisma results.
 */

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  title?: string | null;
};

export type CustomerDTO = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  type: string;
  notes: string | null;
  createdAt: string;
};

export type LeadListItem = {
  id: string;
  customerId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  service: string | null;
  customerType: string;
  message: string | null;
  source: string;
  status: string;
  priority: string;
  value: number | null;
  assignedToId: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  landingPage: string | null;
  referrer: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: CustomerDTO | null;
  assignedTo?: TeamMember | null;
};

export type ActivityDTO = {
  id: string;
  leadId: string;
  type: string;
  description: string;
  meta: string | null;
  userId: string | null;
  user?: TeamMember | null;
  createdAt: string;
};

export type AppointmentDTO = {
  id: string;
  leadId: string | null;
  customerId: string | null;
  technicianId: string | null;
  service: string;
  start: string;
  end: string;
  status: string;
  location: string | null;
  notes: string | null;
  createdAt: string;
  technician?: TeamMember | null;
  customer?: CustomerDTO | null;
  lead?: { id: string; name: string; status: string } | null;
};

export type EstimateDTO = {
  id: string;
  leadId: string;
  title: string;
  amount: number | null;
  status: string;
  notes: string | null;
  createdAt: string;
  lead?: { id: string; name: string; service: string | null; status: string } | null;
};

export type MessageDTO = {
  id: string;
  leadId: string;
  direction: string;
  channel: string;
  body: string;
  status: string;
  createdAt: string;
};

export type ReviewRequestDTO = {
  id: string;
  leadId: string;
  channel: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  lead?: { id: string; name: string; phone: string | null } | null;
};

export type ServiceRequestDTO = {
  id: string;
  leadId: string | null;
  customerId: string | null;
  serviceType: string;
  customerType: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  zip: string;
  preferredDate: string | null;
  preferredTime: string | null;
  description: string | null;
  /** Raw JSON string in the DB; pages parse it into `attachmentList`. */
  attachments: string | null;
  status: string;
  createdAt: string;
  lead?: { id: string; name: string; status: string } | null;
};

export type LeadFullDTO = LeadListItem & {
  activities: ActivityDTO[];
  appointments: AppointmentDTO[];
  estimates: EstimateDTO[];
  messages: MessageDTO[];
  reviewRequests: ReviewRequestDTO[];
  serviceRequests: ServiceRequestDTO[];
};

export type ReviewDTO = {
  id: string;
  customerName: string;
  rating: number;
  title: string | null;
  text: string;
  source: string;
  serviceDate: string | null;
  published: boolean;
  response: string | null;
  createdAt: string;
};

export type MissedCallDTO = {
  id: string;
  phone: string;
  callTime: string;
  status: string;
  smsBody: string | null;
  respondedAt: string | null;
  leadId: string | null;
  createdAt: string;
  lead?: { id: string; name: string; status: string } | null;
};

export type ChatMessageDTO = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

export type ChatSessionDTO = {
  id: string;
  visitorId: string | null;
  leadId: string | null;
  createdAt: string;
  messages: ChatMessageDTO[];
};

export type CustomerWithCounts = CustomerDTO & {
  _count: { leads: number; appointments: number };
  leads?: { id: string; name: string; status: string; service: string | null; createdAt: string }[];
  appointments?: { id: string; service: string; start: string; status: string }[];
};

/** Serialize Prisma rows (Dates → ISO strings) into a DTO shape. */
export function toDTO<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Parse a ServiceRequest.attachments JSON string defensively. */
export function parseAttachments(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((p): p is string => typeof p === "string");
    }
  } catch {
    // corrupted JSON — treat as no attachments
  }
  return [];
}
