import { requireSession } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeader, CardLink } from "@/components/ui/section-header";
import { PageHeader } from "@/components/page-header";
import { KpiStrip } from "@/components/viz/kpi-strip";
import { FunnelColumns } from "@/components/viz/funnel-columns";
import { DistList } from "@/components/viz/dist-list";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { AttentionList } from "@/components/dashboard/attention-list";
import { formatCents } from "@/lib/format";
import {
  getOverviewStats,
  getFunnelColumns,
  getSourceBreakdown,
  getRevenueByMonth,
  getStaleDeals,
} from "@/lib/metrics";

export default async function DashboardPage() {
  const { organizationId } = await requireSession();

  const [stats, funnel, sources, revenue, stale] = await Promise.all([
    getOverviewStats(organizationId),
    getFunnelColumns(organizationId),
    getSourceBreakdown(organizationId),
    getRevenueByMonth(organizationId),
    getStaleDeals(organizationId),
  ]);

  const staleValue = stale.reduce((sum, deal) => sum + deal.valueCents, 0);
  const totalSources = sources.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        description="O dia de hoje: conversão, gargalo e o que está parado"
      />

      <KpiStrip {...stats} />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="py-4">
          <CardContent className="flex min-h-[248px] flex-col px-[18px]">
            <SectionHeader
              title="Funil"
              action={<CardLink href="/funil">Ver funil completo</CardLink>}
            />
            <FunnelColumns stages={funnel.stages} closed={funnel.closed} />
            <div className="mt-3 flex items-center justify-between gap-3 border-t pt-3 text-[11.5px] text-muted-foreground">
              <span className="min-w-0 truncate">
                {funnel.bottleneck ? (
                  <>
                    Maior queda:{" "}
                    <span className="text-warning">
                      {funnel.bottleneck.from} → {funnel.bottleneck.to} (
                      {funnel.bottleneck.delta}%)
                    </span>
                  </>
                ) : (
                  "Sem queda relevante entre etapas"
                )}
              </span>
              <span className="shrink-0 tabular">{funnel.totalEntered} no funil</span>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex min-h-[248px] flex-col px-[18px]">
            <div className="mb-1.5 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-2">
                <span className="font-heading text-[13px] font-semibold tracking-tight">
                  Receita ganha
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-[1.625rem] font-semibold leading-none tracking-tight tabular">
                    {formatCents(stats.wonValue)}
                  </span>
                  <span className="text-xs text-muted-foreground">6 meses</span>
                </div>
              </div>
              <CardLink href="/receita">Ver receita</CardLink>
            </div>
            <RevenueChart data={revenue} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="py-4">
          <CardContent className="flex flex-col px-[18px]">
            <SectionHeader
              title="Precisa de atenção"
              dot="warning"
              meta={`${formatCents(staleValue)} parados`}
            />
            <AttentionList deals={stale.slice(0, 6)} />
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex flex-col px-[18px]">
            <SectionHeader
              title="Origem dos negócios"
              meta={`${totalSources} no período`}
            />
            <DistList
              items={sources}
              emptyMessage="Cadastre a origem nos contatos para ver a distribuição."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
