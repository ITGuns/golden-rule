import Anthropic from "@anthropic-ai/sdk";
import { requireSession } from "@/lib/auth";
import { computeInsightMetrics, type InsightMetrics } from "@/lib/admin-stats";

/**
 * POST /api/admin/insights — computes real aggregates from the database and
 * derives insights + recommendations with a deterministic analyzer (pure
 * threshold logic — nothing invented). If AI_API_KEY is set, the same
 * aggregates are additionally summarized by Claude; on any error the
 * deterministic output stands alone.
 */

type Insight = { title: string; detail: string; metric: string };
type Recommendation = { title: string; detail: string; action: string };

function friendlySource(source: string): string {
  return source.replace(/_/g, " ").toLowerCase();
}

function analyze(m: InsightMetrics): { insights: Insight[]; recommendations: Recommendation[] } {
  const insights: Insight[] = [];
  const recommendations: Recommendation[] = [];

  if (m.leads90 === 0) {
    insights.push({
      title: "Not enough data yet",
      detail:
        "No leads have been recorded in the last 90 days, so trends and conversion metrics cannot be computed. Insights will populate as leads come in.",
      metric: "0 leads / 90d",
    });
    return { insights, recommendations };
  }

  // Lead volume trend (30d vs prior 30d)
  if (m.leadVolumeDeltaPct !== null) {
    const dir = m.leadVolumeDeltaPct > 0 ? "up" : m.leadVolumeDeltaPct < 0 ? "down" : "flat";
    insights.push({
      title:
        dir === "flat"
          ? "Lead volume is holding steady"
          : `Lead volume is ${dir} ${Math.abs(m.leadVolumeDeltaPct)}% month over month`,
      detail: `${m.leads30} leads in the last 30 days vs ${m.leadsPrev30} in the prior 30 days.`,
      metric: `${m.leadVolumeDeltaPct > 0 ? "+" : ""}${m.leadVolumeDeltaPct}%`,
    });
    if (m.leadVolumeDeltaPct <= -20) {
      recommendations.push({
        title: "Investigate the drop in lead volume",
        detail: `Leads fell ${Math.abs(m.leadVolumeDeltaPct)}% versus the prior 30 days (${m.leads30} vs ${m.leadsPrev30}).`,
        action:
          "Compare the sources table for the two periods in Reports → Marketing to see which channel slowed down.",
      });
    }
  } else if (m.leads30 > 0) {
    insights.push({
      title: "Lead flow is getting established",
      detail: `${m.leads30} leads in the last 30 days; there is no prior-period data to compare against yet.`,
      metric: `${m.leads30} leads / 30d`,
    });
  }

  // Top service demand
  const topService = m.topServices[0];
  if (topService) {
    const share = Math.round((topService.count / m.leads90) * 100);
    insights.push({
      title: `${topService.service} is the most-requested service`,
      detail: `${topService.count} of ${m.leads90} leads in the last 90 days (${share}%) asked for ${topService.service}.`,
      metric: `${topService.count} leads`,
    });
  }

  // Source concentration
  const topSource = m.sourceMix[0];
  if (topSource) {
    insights.push({
      title:
        topSource.sharePct >= 60
          ? `Lead flow is concentrated in one source`
          : `Top lead source: ${friendlySource(topSource.source)}`,
      detail: `${friendlySource(topSource.source)} produced ${topSource.count} of ${m.leads90} leads (${topSource.sharePct}%) over 90 days across ${m.sourceMix.length} active source${m.sourceMix.length === 1 ? "" : "s"}.`,
      metric: `${topSource.sharePct}% share`,
    });
    if (topSource.sharePct >= 60 && m.sourceMix.length > 1) {
      recommendations.push({
        title: "Diversify lead sources",
        detail: `${topSource.sharePct}% of the last 90 days of leads came from ${friendlySource(topSource.source)}, which is a single point of failure.`,
        action:
          "Review the other sources in the Marketing report and shift attention to the next-best performing channels.",
      });
    }
  }

  // Conversion
  if (m.conversionRate90Pct !== null) {
    insights.push({
      title: `${m.conversionRate90Pct}% of leads reached Completed`,
      detail: `Of ${m.leads90} leads in the last 90 days, ${m.funnel90.find((f) => f.status === "COMPLETED")?.count ?? 0} reached the Completed stage.`,
      metric: `${m.conversionRate90Pct}%`,
    });
    if (m.conversionRate90Pct < 25 && m.leads90 >= 10) {
      const stalled = m.funnel90
        .filter((f) => ["NEW", "CONTACTED", "QUALIFIED"].includes(f.status))
        .reduce((a, b) => a + b.count, 0);
      recommendations.push({
        title: "Improve pipeline follow-through",
        detail: `Only ${m.conversionRate90Pct}% of the last 90 days of leads completed, and ${stalled} leads currently sit in the New / Contacted / Qualified stages.`,
        action: "Work the early-stage leads in the Leads board and move each one to a next status.",
      });
    }
  }

  // Missed calls
  if (m.missedCalls90.total > 0) {
    insights.push({
      title: `${m.missedCalls90.responded} of ${m.missedCalls90.total} missed calls got a response`,
      detail: `Response rate ${m.missedCalls90.responseRatePct ?? 0}% over 90 days${
        m.missedCalls90.avgResponseMinutes !== null
          ? `, averaging ${m.missedCalls90.avgResponseMinutes} minutes to respond`
          : ""
      }.`,
      metric: `${m.missedCalls90.responseRatePct ?? 0}% responded`,
    });
    if ((m.missedCalls90.responseRatePct ?? 0) < 80 && m.missedCalls90.total >= 5) {
      recommendations.push({
        title: "Tighten missed-call follow-up",
        detail: `${m.missedCalls90.total - m.missedCalls90.responded} of ${m.missedCalls90.total} missed calls in the last 90 days never got a response.`,
        action: "Open Missed Calls daily and clear the New queue with the text-back workflow.",
      });
    }
  }

  // Review requests
  if (m.reviewRequests90.sent > 0) {
    insights.push({
      title: `${m.reviewRequests90.conversionPct ?? 0}% of review requests completed`,
      detail: `${m.reviewRequests90.completed} of ${m.reviewRequests90.sent} review requests sent in the last 90 days were completed.`,
      metric: `${m.reviewRequests90.completed}/${m.reviewRequests90.sent}`,
    });
    if ((m.reviewRequests90.conversionPct ?? 0) < 50 && m.reviewRequests90.sent >= 5) {
      recommendations.push({
        title: "Increase review completions",
        detail: `Fewer than half of review requests (${m.reviewRequests90.conversionPct}%) turned into a review over the last 90 days.`,
        action: "Send requests right after a Completed job and follow up once on pending ones in Reviews.",
      });
    }
  }

  // Speed to first contact
  if (m.avgHoursNewToContacted !== null) {
    insights.push({
      title: `Average ${m.avgHoursNewToContacted}h from New to Contacted`,
      detail:
        "Measured from lead creation to the first recorded status change to Contacted over the last 90 days.",
      metric: `${m.avgHoursNewToContacted}h`,
    });
    if (m.avgHoursNewToContacted > 24) {
      recommendations.push({
        title: "Respond to new leads faster",
        detail: `Leads currently wait an average of ${m.avgHoursNewToContacted} hours before their status moves to Contacted.`,
        action:
          "Review the Leads queue at least daily and log the first contact so New leads move to Contacted sooner.",
      });
    }
  }

  return { insights, recommendations };
}

async function generateAiSummary(metrics: InsightMetrics): Promise<string | undefined> {
  if (!process.env.AI_API_KEY) return undefined;
  try {
    const client = new Anthropic({ apiKey: process.env.AI_API_KEY });
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2000,
      system: "You are a business analyst. Use ONLY the metrics provided. Do not invent data.",
      messages: [
        {
          role: "user",
          content: `Write a short plain-language summary (4-6 sentences) of these HVAC business metrics for the owner, then the two most important takeaways as a short list. Metrics JSON:\n${JSON.stringify(metrics, null, 2)}`,
        },
      ],
    });
    let text = "";
    for (const block of response.content) {
      if (block.type === "text") text += (text ? "\n" : "") + block.text;
    }
    text = text.trim();
    return text || undefined;
  } catch {
    // Fall back to the deterministic analyzer output only.
    return undefined;
  }
}

export async function POST() {
  try {
    await requireSession();
    const metrics = await computeInsightMetrics();
    const { insights, recommendations } = analyze(metrics);
    const aiSummary = await generateAiSummary(metrics);

    return Response.json({
      generatedAt: new Date().toISOString(),
      metrics,
      insights,
      recommendations,
      ...(aiSummary ? { aiSummary } : {}),
    });
  } catch (e) {
    if (e instanceof Response) return e;
    return Response.json({ error: "Failed to generate insights" }, { status: 500 });
  }
}
