import { db } from "@/lib/db";

const STALE_DAYS = 7;
const REVENUE_MONTHS = 6;

export async function getOverviewStats(organizationId: string) {
  const [openAgg, wonAgg, lostCount] = await Promise.all([
    db.deal.aggregate({
      where: { organizationId, status: "OPEN" },
      _count: true,
      _sum: { value: true },
    }),
    db.deal.aggregate({
      where: { organizationId, status: "WON" },
      _count: true,
      _sum: { value: true },
    }),
    db.deal.count({ where: { organizationId, status: "LOST" } }),
  ]);

  const wonCount = wonAgg._count;
  const closedCount = wonCount + lostCount;
  const winRate = closedCount > 0 ? wonCount / closedCount : 0;
  const avgTicket = wonCount > 0 ? Number(wonAgg._sum.value ?? 0) / wonCount : 0;

  return {
    openCount: openAgg._count,
    openValue: Number(openAgg._sum.value ?? 0),
    wonCount,
    wonValue: Number(wonAgg._sum.value ?? 0),
    lostCount,
    winRate,
    avgTicket,
  };
}

export async function getFunnel(organizationId: string) {
  const stages = await db.pipelineStage.findMany({
    where: { organizationId },
    orderBy: { order: "asc" },
  });

  const history = await db.stageHistory.findMany({
    where: { toStage: { organizationId } },
    select: { dealId: true, toStageId: true },
  });

  const dealsByStage = new Map<string, Set<string>>();
  for (const entry of history) {
    if (!dealsByStage.has(entry.toStageId)) dealsByStage.set(entry.toStageId, new Set());
    dealsByStage.get(entry.toStageId)!.add(entry.dealId);
  }

  return stages.map((stage) => ({
    stageId: stage.id,
    name: stage.name,
    type: stage.type,
    count: dealsByStage.get(stage.id)?.size ?? 0,
  }));
}

export async function getLossReasonBreakdown(organizationId: string) {
  const grouped = await db.deal.groupBy({
    by: ["lostReasonId"],
    where: { organizationId, status: "LOST", lostReasonId: { not: null } },
    _count: true,
  });

  const reasons = await db.lossReason.findMany({ where: { organizationId } });
  const reasonMap = new Map(reasons.map((reason) => [reason.id, reason.label]));

  return grouped
    .map((entry) => ({
      label: reasonMap.get(entry.lostReasonId ?? "") ?? "Sem motivo",
      count: entry._count,
    }))
    .sort((a, b) => b.count - a.count);
}

export async function getSourceBreakdown(organizationId: string) {
  const deals = await db.deal.findMany({
    where: { organizationId },
    select: { contact: { select: { source: true } } },
  });

  const counts = new Map<string, number>();
  for (const deal of deals) {
    const source = deal.contact?.source?.trim() || "Não informado";
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

export async function getServiceTypeBreakdown(organizationId: string) {
  const grouped = await db.deal.groupBy({
    by: ["serviceType"],
    where: { organizationId },
    _count: true,
  });

  return grouped
    .map((entry) => ({ label: entry.serviceType, count: entry._count }))
    .sort((a, b) => b.count - a.count);
}

export async function getRevenueByMonth(organizationId: string) {
  const since = new Date();
  since.setMonth(since.getMonth() - (REVENUE_MONTHS - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const wonDeals = await db.deal.findMany({
    where: { organizationId, status: "WON", closedAt: { gte: since } },
    select: { value: true, closedAt: true },
  });

  const months: { key: string; label: string; value: number }[] = [];
  for (let i = REVENUE_MONTHS - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleDateString("pt-BR", { month: "short" });
    months.push({ key, label, value: 0 });
  }

  const byKey = new Map(months.map((m) => [m.key, m]));
  for (const deal of wonDeals) {
    if (!deal.closedAt) continue;
    const key = `${deal.closedAt.getFullYear()}-${deal.closedAt.getMonth()}`;
    const bucket = byKey.get(key);
    if (bucket) bucket.value += Number(deal.value);
  }

  return months;
}

export async function getStaleDeals(organizationId: string) {
  const now = Date.now();
  const threshold = new Date(now);
  threshold.setDate(threshold.getDate() - STALE_DAYS);

  const deals = await db.deal.findMany({
    where: { organizationId, status: "OPEN" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      activities: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  return deals
    .map((deal) => {
      const lastTouch = deal.activities[0]?.createdAt ?? deal.createdAt;
      const daysSinceContact = Math.floor((now - lastTouch.getTime()) / (1000 * 60 * 60 * 24));
      return { id: deal.id, title: deal.title, lastTouch, daysSinceContact };
    })
    .filter((deal) => deal.lastTouch < threshold)
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact);
}
