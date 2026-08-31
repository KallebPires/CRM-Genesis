import { db } from "@/lib/db";

const STALE_DAYS = 7;
const REVENUE_MONTHS = 6;

/**
 * Todos os valores saem em CENTAVOS, como estão no banco. A formatação para
 * reais acontece na borda, em `formatCents`.
 *
 * `_count: { _all: true }` em vez de `_count: true`: no conector MongoDB a
 * forma abreviada tipa como união e não como número.
 */
export async function getOverviewStats(organizationId: string) {
  const [openAgg, wonAgg, lostCount] = await Promise.all([
    db.deal.aggregate({
      where: { organizationId, status: "OPEN" },
      _count: { _all: true },
      _sum: { valueCents: true },
    }),
    db.deal.aggregate({
      where: { organizationId, status: "WON" },
      _count: { _all: true },
      _sum: { valueCents: true },
    }),
    db.deal.count({ where: { organizationId, status: "LOST" } }),
  ]);

  const openCount = openAgg._count._all;
  const wonCount = wonAgg._count._all;
  const wonValue = wonAgg._sum.valueCents ?? 0;
  const closedCount = wonCount + lostCount;

  return {
    openCount,
    openValue: openAgg._sum.valueCents ?? 0,
    wonCount,
    wonValue,
    lostCount,
    winRate: closedCount > 0 ? wonCount / closedCount : 0,
    avgTicket: wonCount > 0 ? Math.round(wonValue / wonCount) : 0,
  };
}

export async function getFunnel(organizationId: string) {
  // Em paralelo: as duas consultas são independentes e cada ida ao banco
  // custa ~170 ms a partir do Brasil.
  const [stages, history] = await Promise.all([
    db.pipelineStage.findMany({
      where: { organizationId },
      orderBy: { order: "asc" },
    }),
    db.stageHistory.findMany({
      where: { toStage: { organizationId } },
      select: { dealId: true, toStageId: true },
    }),
  ]);

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

/**
 * O funil pronto para desenho: separa as etapas abertas das de fechamento,
 * calcula a queda contra a etapa anterior e marca o maior gargalo.
 */
export async function getFunnelColumns(organizationId: string) {
  const rows = await getFunnel(organizationId);
  const open = rows.filter((r) => r.type === "OPEN");
  const won = rows.find((r) => r.type === "WON");
  const lost = rows.find((r) => r.type === "LOST");

  const peak = Math.max(...open.map((r) => r.count), 1);

  type Column = {
    label: string;
    count: number;
    delta: number | null;
    height: number;
    tone: "open" | "won" | "lost";
    bottleneck?: boolean;
  };

  const stages: Column[] = open.map((row, index) => {
    const previous = index === 0 ? null : open[index - 1].count;
    const delta =
      previous === null || previous === 0
        ? null
        : Math.round(((row.count - previous) / previous) * 100);
    return {
      label: row.name,
      count: row.count,
      delta,
      height: Math.round((row.count / peak) * 100),
      tone: "open",
    };
  });

  // O gargalo é a maior queda percentual entre etapas consecutivas.
  let worst = -1;
  let worstIndex = -1;
  stages.forEach((stage, index) => {
    if (stage.delta !== null && stage.delta < 0 && Math.abs(stage.delta) > worst) {
      worst = Math.abs(stage.delta);
      worstIndex = index;
    }
  });
  if (worstIndex >= 0) stages[worstIndex] = { ...stages[worstIndex], bottleneck: true };

  const closed: Column[] = [];
  if (won) {
    closed.push({
      label: won.name,
      count: won.count,
      delta: null,
      height: Math.round((won.count / peak) * 100),
      tone: "won",
    });
  }
  if (lost) {
    closed.push({
      label: lost.name,
      count: lost.count,
      delta: null,
      height: Math.round((lost.count / peak) * 100),
      tone: "lost",
    });
  }

  const bottleneck =
    worstIndex > 0
      ? {
          from: stages[worstIndex - 1].label,
          to: stages[worstIndex].label,
          delta: stages[worstIndex].delta,
        }
      : null;

  return { stages, closed, bottleneck, totalEntered: open[0]?.count ?? 0 };
}

export async function getLossReasonBreakdown(organizationId: string) {
  const [grouped, reasons] = await Promise.all([
    db.deal.groupBy({
      by: ["lostReasonId"],
      where: { organizationId, status: "LOST", lostReasonId: { not: null } },
      _count: { _all: true },
    }),
    db.lossReason.findMany({ where: { organizationId } }),
  ]);
  const reasonMap = new Map(reasons.map((reason) => [reason.id, reason.label]));

  return grouped
    .map((entry) => ({
      label: reasonMap.get(entry.lostReasonId ?? "") ?? "Sem motivo",
      count: entry._count._all,
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
    _count: { _all: true },
  });

  return grouped
    .map((entry) => ({ label: entry.serviceType, count: entry._count._all }))
    .sort((a, b) => b.count - a.count);
}

export async function getRevenueByMonth(organizationId: string) {
  const since = new Date();
  since.setMonth(since.getMonth() - (REVENUE_MONTHS - 1));
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const wonDeals = await db.deal.findMany({
    where: { organizationId, status: "WON", closedAt: { gte: since } },
    select: { valueCents: true, closedAt: true },
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
    if (bucket) bucket.value += deal.valueCents;
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
      valueCents: true,
      company: { select: { name: true } },
      contact: { select: { name: true } },
      stage: { select: { name: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } },
    },
  });

  return deals
    .map((deal) => {
      const lastTouch = deal.activities[0]?.createdAt ?? deal.createdAt;
      const daysSinceContact = Math.floor((now - lastTouch.getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: deal.id,
        title: deal.title,
        company: deal.company?.name ?? deal.contact?.name ?? null,
        stage: deal.stage.name,
        valueCents: deal.valueCents,
        lastTouch,
        daysSinceContact,
      };
    })
    .filter((deal) => deal.lastTouch < threshold)
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact);
}

/**
 * Tempo médio que um negócio passa em cada etapa, em dias. Para cada entrada
 * no histórico, mede até a entrada seguinte do mesmo negócio; se não houver
 * seguinte, o negócio ainda está lá e a medida vai até agora.
 */
export async function getAvgDaysPerStage(organizationId: string) {
  const [stages, history] = await Promise.all([
    db.pipelineStage.findMany({
      where: { organizationId, type: "OPEN" },
      orderBy: { order: "asc" },
    }),
    db.stageHistory.findMany({
      where: { toStage: { organizationId } },
      select: { dealId: true, toStageId: true, changedAt: true },
      orderBy: { changedAt: "asc" },
    }),
  ]);

  const byDeal = new Map<string, { toStageId: string; changedAt: Date }[]>();
  for (const entry of history) {
    if (!byDeal.has(entry.dealId)) byDeal.set(entry.dealId, []);
    byDeal.get(entry.dealId)!.push(entry);
  }

  const totals = new Map<string, { days: number; samples: number }>();
  const now = Date.now();

  for (const entries of byDeal.values()) {
    entries.forEach((entry, index) => {
      const next = entries[index + 1];
      const end = next ? next.changedAt.getTime() : now;
      const days = (end - entry.changedAt.getTime()) / (1000 * 60 * 60 * 24);
      const bucket = totals.get(entry.toStageId) ?? { days: 0, samples: 0 };
      bucket.days += days;
      bucket.samples += 1;
      totals.set(entry.toStageId, bucket);
    });
  }

  return stages.map((stage) => {
    const bucket = totals.get(stage.id);
    return {
      label: stage.name,
      count: bucket && bucket.samples > 0 ? Math.round(bucket.days / bucket.samples) : 0,
    };
  });
}

