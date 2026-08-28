/**
 * Seed: real site content (services, areas, articles, reviews — extracted from
 * the live goldenrulecomfort.com) plus clearly-labeled DEMO CRM data
 * (isDemo: true) so the admin dashboard is explorable before real leads arrive.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const db = new PrismaClient();
const data = (f: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "seed-data", f), "utf8"));

const CATEGORY_BY_SLUG: Record<string, string> = {
  "3-health-benefits-for-using-your-ac-while-sleeping-2": "Cooling",
  "5-ways-to-save-money-on-your-air-conditioning-and-summer-energy-bill": "Energy Efficiency",
  "ac-maintenance-checklist": "Maintenance",
  "happy-thanksgiving": "HVAC Education",
  "heat-pump-maintenance-tips": "Maintenance",
  "how-does-your-central-air-conditioner-cool-your-home": "Cooling",
  "hvac-ways-to-go-green-in-your-home": "Energy Efficiency",
  "is-it-normal-for-my-ac-to-turn-on-and-off": "Cooling",
  "what-are-zone-control-systems": "HVAC Education",
  "what-does-ac-seer-mean": "Energy Efficiency",
  "what-does-indoor-air-quality-have-to-do-with-allergies": "Indoor Air Quality",
  "what-indoor-air-quality-accessories-can-help-keep-me-healthy": "Indoor Air Quality",
  "when-is-it-time-for-a-split-system-ac-replacement": "Cooling",
  "why-do-i-need-ac-maintenance-now": "Maintenance",
  "why-is-indoor-air-quality-iaq-important": "Indoor Air Quality",
  "why-is-my-ac-blowing-hot-air": "Cooling",
};

async function main() {
  // ————— Users (team) —————
  const password = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "GoldenRule2026!", 10);
  const admin = await db.user.upsert({
    where: { email: "admin@goldenrule.local" },
    update: {},
    create: {
      name: "Site Administrator",
      email: "admin@goldenrule.local",
      passwordHash: password,
      role: "SUPER_ADMIN",
      title: "Administrator",
    },
  });
  const demoUsers = [
    { name: "Demo Dispatcher", email: "dispatcher@goldenrule.local", role: "DISPATCHER", title: "Dispatcher (demo)" },
    { name: "Demo Technician A", email: "tech-a@goldenrule.local", role: "TECHNICIAN", title: "Service Technician (demo)" },
    { name: "Demo Technician B", email: "tech-b@goldenrule.local", role: "TECHNICIAN", title: "Service Technician (demo)" },
  ];
  const techs: string[] = [];
  for (const u of demoUsers) {
    const created = await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: password },
    });
    if (u.role === "TECHNICIAN") techs.push(created.id);
  }

  // ————— Real content: services, areas, articles, reviews —————
  const services = data("services.json");
  for (let i = 0; i < services.length; i++) {
    const s = services[i];
    await db.service.upsert({
      where: { slug: s.slug },
      update: { body: s.body, excerpt: s.excerpt, heroImage: s.heroImage },
      create: {
        slug: s.slug,
        name: s.name,
        division: s.division,
        excerpt: s.excerpt,
        body: s.body,
        heroImage: s.heroImage ? `/images/${s.heroImage}` : null,
        sortOrder: i,
      },
    });
  }

  const areas = data("areas.json");
  for (const a of areas) {
    await db.serviceArea.upsert({
      where: { slug: a.slug },
      update: { body: a.body },
      create: { slug: a.slug, city: a.city, state: a.state, body: a.body },
    });
  }

  const articles = data("articles.json");
  for (const a of articles) {
    await db.article.upsert({
      where: { slug: a.slug },
      update: {},
      create: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt.slice(0, 400),
        body: a.body,
        category: CATEGORY_BY_SLUG[a.slug] || "HVAC Education",
        heroImage: a.heroImage ? `/images/${a.heroImage}` : null,
        published: true,
        publishedAt: a.date ? new Date(a.date) : new Date(),
      },
    });
  }

  // Real customer testimonials from the live site (source: WEBSITE).
  const testimonials = data("testimonials.json");
  for (const t of testimonials) {
    const exists = await db.review.findFirst({ where: { title: t.title } });
    if (!exists && t.quote) {
      await db.review.create({
        data: {
          customerName: "Golden Rule Customer",
          rating: 5,
          title: t.title,
          text: t.quote,
          source: "WEBSITE",
          serviceDate: t.date ? new Date(t.date) : null,
          published: true,
        },
      });
    }
  }

  // ————— Settings —————
  const settings: Record<string, unknown> = {
    company: {
      name: "Golden Rule Air Conditioning & Heating",
      phone: "281-500-7874",
      email: "",
      street: "9306 Thomasville Dr.",
      city: "Houston",
      state: "TX",
      zip: "77064",
      license: "TACLA27294C",
      hours: "", // not published on the source site — supply real hours here
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
  for (const [key, value] of Object.entries(settings)) {
    await db.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(value) },
    });
  }

  // ————— DEMO CRM data (clearly labeled, isDemo: true) —————
  const existingDemo = await db.lead.count({ where: { isDemo: true } });
  if (existingDemo === 0) {
    const services10 = ["AC Repair", "AC Installation", "Heating", "Maintenance", "Air Duct", "Indoor Air Quality", "Heat Pump", "Commercial", "New Construction", "Other"];
    const sources = ["WEBSITE", "CHATBOT", "PHONE", "MISSED_CALL", "SERVICE_REQUEST", "ESTIMATE_REQUEST", "REFERRAL", "ORGANIC", "PAID", "SOCIAL"];
    const statuses = ["NEW", "NEW", "NEW", "CONTACTED", "CONTACTED", "QUALIFIED", "ESTIMATE", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "COMPLETED", "REVIEW_REQUESTED", "CLOSED"];
    const cities = ["Houston", "Cypress", "Spring", "Tomball", "Katy", "Sugar Land"];
    const firstNames = ["Alex", "Jordan", "Sam", "Taylor", "Casey", "Morgan", "Riley", "Jamie", "Drew", "Avery", "Quinn", "Reese"];
    const lastNames = ["Demo-Smith", "Demo-Garcia", "Demo-Nguyen", "Demo-Johnson", "Demo-Lee", "Demo-Brown", "Demo-Davis", "Demo-Martinez"];

    const now = Date.now();
    const DAY = 86400000;
    let seedRand = 42;
    const rand = () => {
      // deterministic LCG so reseeding is reproducible
      seedRand = (seedRand * 1664525 + 1013904223) % 4294967296;
      return seedRand / 4294967296;
    };
    const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)];

    for (let i = 0; i < 48; i++) {
      const first = pick(firstNames);
      const last = pick(lastNames);
      const city = pick(cities);
      const createdAt = new Date(now - Math.floor(rand() * 90) * DAY - Math.floor(rand() * DAY));
      const customer = await db.customer.create({
        data: {
          firstName: first,
          lastName: last,
          email: `${first.toLowerCase()}.${i}@example.com`,
          phone: `281-555-${String(1000 + i)}`,
          street: `${100 + i} Demo Lane`,
          city,
          zip: "77064",
          type: rand() > 0.8 ? "COMMERCIAL" : "RESIDENTIAL",
          isDemo: true,
        },
      });
      const status = pick(statuses);
      const lead = await db.lead.create({
        data: {
          customerId: customer.id,
          name: `${first} ${last}`,
          email: customer.email,
          phone: customer.phone,
          service: pick(services10),
          customerType: customer.type,
          message: "Demo lead generated by the seed script.",
          source: pick(sources),
          status,
          priority: rand() > 0.85 ? "HIGH" : "NORMAL",
          value: status === "COMPLETED" || status === "CLOSED" || status === "REVIEW_REQUESTED" ? Math.round((500 + rand() * 9500) / 50) * 50 : null,
          assignedToId: rand() > 0.5 ? pick(techs) : null,
          utmSource: rand() > 0.6 ? pick(["google", "facebook", "bing"]) : null,
          utmMedium: rand() > 0.6 ? pick(["cpc", "organic", "social"]) : null,
          landingPage: pick(["/", "/residential/air-conditioning", "/request-service", "/financing"]),
          isDemo: true,
          createdAt,
        },
      });
      await db.leadActivity.create({
        data: { leadId: lead.id, type: "CREATED", description: "Lead created (demo seed)", createdAt },
      });
      if (status !== "NEW") {
        await db.leadActivity.create({
          data: { leadId: lead.id, type: "STATUS_CHANGE", description: `Status moved to ${status} (demo seed)`, createdAt: new Date(createdAt.getTime() + DAY) },
        });
      }
      if (["SCHEDULED", "IN_PROGRESS", "COMPLETED", "REVIEW_REQUESTED"].includes(status)) {
        const start = new Date(now + (rand() * 14 - 4) * DAY);
        start.setHours(8 + Math.floor(rand() * 8), 0, 0, 0);
        await db.appointment.create({
          data: {
            leadId: lead.id,
            customerId: customer.id,
            technicianId: pick(techs),
            service: lead.service || "Service",
            start,
            end: new Date(start.getTime() + 2 * 3600000),
            status: status === "COMPLETED" || status === "REVIEW_REQUESTED" ? "COMPLETED" : pick(["REQUESTED", "CONFIRMED", "CONFIRMED"]),
            location: `${customer.street}, ${city}, TX`,
            isDemo: true,
          },
        });
      }
      if (status === "ESTIMATE") {
        await db.estimate.create({
          data: { leadId: lead.id, title: `${lead.service} estimate`, amount: Math.round((1500 + rand() * 8000) / 100) * 100, status: "SENT", isDemo: true },
        });
      }
      if (status === "REVIEW_REQUESTED") {
        await db.reviewRequest.create({
          data: { leadId: lead.id, channel: "SMS", status: "SENT", sentAt: new Date(), isDemo: true },
        });
      }
    }

    for (let i = 0; i < 6; i++) {
      await db.missedCall.create({
        data: {
          phone: `832-555-0${100 + i}`,
          callTime: new Date(now - Math.floor(rand() * 7) * DAY),
          status: pick(["NEW", "TEXTED", "RESPONDED", "RESOLVED"]),
          smsBody: "Hi! This is Golden Rule Air Conditioning & Heating. We noticed we missed your call. How can we help?",
          isDemo: true,
        },
      });
    }

    // demo analytics events across the last 30 days
    const eventTypes = ["page_view", "page_view", "page_view", "page_view", "phone_click", "form_start", "form_complete", "chat_start", "cta_click"];
    const paths = ["/", "/residential", "/residential/air-conditioning", "/request-service", "/commercial", "/financing", "/news", "/contact"];
    for (let i = 0; i < 600; i++) {
      await db.analyticsEvent.create({
        data: {
          type: pick(eventTypes),
          path: pick(paths),
          sessionId: `demo-${Math.floor(rand() * 200)}`,
          meta: JSON.stringify({ demo: true }),
          createdAt: new Date(now - Math.floor(rand() * 30) * DAY - Math.floor(rand() * DAY)),
        },
      });
    }
    console.log("Demo CRM data created (isDemo: true).");
  }

  console.log(`Seed complete. Admin login: admin@goldenrule.local / ${process.env.SEED_ADMIN_PASSWORD || "GoldenRule2026!"}`);
  console.log(`Users: ${await db.user.count()}, services: ${await db.service.count()}, articles: ${await db.article.count()}, reviews: ${await db.review.count()}, leads: ${await db.lead.count()}`);
  void admin;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
