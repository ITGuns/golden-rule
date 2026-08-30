import { db } from "@/lib/db";
import { ReviewsManager } from "@/components/admin/crm/ReviewsManager";
import { toDTO, type ReviewDTO, type ReviewRequestDTO } from "@/components/admin/crm/types";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const [reviews, reviewRequests, requested, sent, completed] = await Promise.all([
    db.review.findMany({ orderBy: { createdAt: "desc" }, take: 300 }),
    db.reviewRequest.findMany({
      include: { lead: { select: { id: true, name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.reviewRequest.count(),
    // "sent" = anything that left PENDING (completed/declined were sent too)
    db.reviewRequest.count({ where: { status: { not: "PENDING" } } }),
    db.reviewRequest.count({ where: { status: "COMPLETED" } }),
  ]);

  return (
    <ReviewsManager
      initialReviews={toDTO<ReviewDTO[]>(reviews)}
      initialRequests={toDTO<ReviewRequestDTO[]>(reviewRequests)}
      stats={{
        requested,
        sent,
        completed,
        responseRate: sent > 0 ? completed / sent : 0,
      }}
    />
  );
}
