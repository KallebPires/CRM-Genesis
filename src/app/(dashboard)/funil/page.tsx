import { requireSession } from "@/lib/session";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { FunnelColumns } from "@/components/viz/funnel-columns";
import { FunnelVertical, ClosedSplit } from "@/components/viz/funnel-vertical";
import { DistList } from "@/components/viz/dist-list";
import {
  getFunnelColumns,
  getOverviewStats,
  getAvgDaysPerStage,
  getLossReasonBreakdown,
} from "@/lib/metrics";

export default async function FunilPage() {
  const { organizationId } = await requireSession();

  const [funnel, stats, avgDays, lossReasons] = await Promise.all([
    getFunnelColumns(organizationId),
    getOverviewStats(organizationId),
    getAvgDaysPerStage(organizationId),
    getLossReasonBreakdown(organizationId),
  ]);

  return (
    <div className="space-y-4">
      <PageHeader title="Funil" description="Onde os negócios avançam e onde travam" />

      <Card className="py-4">
        <CardContent className="flex min-h-[260px] flex-col px-[18px]">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <span className="font-heading text-[13px] font-semibold tracking-tight">
              Funil de conversão por etapa
            </span>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-muted-foreground tabular">
                {funnel.totalEntered} negócios no período
              </span>
              {funnel.bottleneck ? (
                <span className="text-warning">
                  maior queda: {funnel.bottleneck.from} → {funnel.bottleneck.to}
                </span>
              ) : null}
            </div>
          </div>
          <div className="mt-3.5 flex min-h-[180px] flex-1">
            <FunnelColumns stages={funnel.stages} closed={funnel.closed} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_1fr_1fr]">
        <Card className="py-4">
          <CardContent className="flex flex-col px-[18px]">
            <SectionHeader
              title="Funil de conversão"
              meta={`${funnel.totalEntered} negócios`}
            />
            <FunnelVertical stages={funnel.stages} />
            <ClosedSplit won={stats.wonCount} lost={stats.lostCount} />
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex flex-col px-[18px]">
            <SectionHeader title="Tempo médio na etapa" meta="dias" />
            <DistList
              items={avgDays}
              emptyMessage="Mova negócios entre etapas para medir o tempo."
            />
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="flex flex-col px-[18px]">
            <SectionHeader title="Motivo de perda" meta={`${stats.lostCount} perdidos`} />
            <DistList
              items={lossReasons}
              tone="danger"
              emptyMessage="Nenhum negócio perdido ainda."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
